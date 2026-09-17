import { NextResponse } from "next/server";
import {
  AttachmentType,
  CorrectionStatus,
  SignerRole,
  UploadedByType,
} from "@prisma/client";
import { db } from "@/lib/db";
import { publicCorrectionSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { saveSignature } from "@/lib/signature-storage";
import {
  saveAttachment,
  validateSupportingPhoto,
} from "@/lib/attachment-storage";
import { nextRequestNumber } from "@/lib/request-number";
import { buildRoutingDecision } from "@/lib/routing";
import { writeAuditLog } from "@/lib/audit";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendRequestToRecords } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;
  const userAgent = request.headers.get("user-agent") || undefined;
  const rateKey = ipAddress ?? "public-unknown";
  const rateLimit = checkRateLimit(rateKey, {
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  let photos: File[];
  try {
    const formData = await request.formData();
    const payload = formData.get("payload");
    if (typeof payload !== "string") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }
    body = JSON.parse(payload);
    photos = formData
      .getAll("supportingPhotos")
      .filter((file): file is File => file instanceof File);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (photos.length === 0) {
    return NextResponse.json(
      { error: "Supporting documentation photo is required." },
      { status: 422 },
    );
  }

  const photoError = photos.map(validateSupportingPhoto).find(Boolean);
  if (photoError) {
    return NextResponse.json({ error: photoError }, { status: 422 });
  }

  const parsed = publicCorrectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please correct the highlighted fields.",
        fieldErrors: parsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const humanVerified = await verifyTurnstile(
    input.turnstileToken,
    ipAddress,
  );
  if (!humanVerified) {
    return NextResponse.json(
      { error: "Human verification failed. Please try again." },
      { status: 400 },
    );
  }

  const signatureReference = await saveSignature(input.signatureDataUrl);
  const savedPhotos = await Promise.all(
    photos.map(async (photo) => ({
      fileName: photo.name,
      fileUrl: await saveAttachment(photo),
      mimeType: photo.type,
      fileSize: photo.size,
    })),
  );

  try {
    const result = await db.$transaction(async (tx) => {
      const [requestNumber, routingRules] = await Promise.all([
        nextRequestNumber(tx),
        tx.routingRule.findMany({
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        }),
      ]);

      const routing = buildRoutingDecision(
        {
          correctionItems: input.correctionItems.map(
            (item) => item.incorrectItem,
          ),
          sourceOfError: input.sourceOfError,
          instructorIdentifier: input.instructorIdentifier,
        },
        routingRules,
      );

      const correctionRequest = await tx.correctionRequest.create({
        data: {
          requestNumber,
          studentName: input.studentName,
          studentId: input.studentId,
          transactionInError: input.transactionInError,
          aircraftRegistration: input.aircraftRegistration.toUpperCase(),
          sourceOfError: input.sourceOfError,
          sourceOtherText: input.sourceOtherText || null,
          submittedByName: input.submittedByName,
          submittedByEmail: input.submittedByEmail || null,
          instructorIdentifier: input.instructorIdentifier,
          submittedPublicly: true,
          status: routing.status,
          currentAssigneeRole: routing.currentAssigneeRole,
          currentAssigneeUserId: routing.currentAssigneeUserId,
          sentToRecordsAt: routing.directToRecords ? new Date() : null,
          items: {
            create: input.correctionItems.map((item, index) => ({
              incorrectItem: item.incorrectItem,
              customItemLabel: item.customItemLabel || null,
              nowReads: item.nowReads || null,
              shouldRead: item.shouldRead,
              remarks: item.remarks || null,
              sortOrder: index,
            })),
          },
          signatures: {
            create: {
              signerName: input.submittedByName,
              signerIdentifier: input.instructorIdentifier,
              signerRole: SignerRole.CFI,
              signatureImageUrl: signatureReference,
              signedAt: new Date(`${input.dateSigned}T12:00:00.000Z`),
              ipAddress,
              userAgent,
              signatureReason: "Public records correction submission",
            },
          },
          approvals: {
            create: routing.approvals.map((approval) => ({
              approverRole: approval.role,
              approverUserId: approval.userId,
              signatureRequired: approval.signatureRequired,
              commentsRequired: approval.commentsRequired,
            })),
          },
          attachments: {
            create: savedPhotos.map((photo) => ({
              fileName: photo.fileName,
              fileUrl: photo.fileUrl,
              mimeType: photo.mimeType,
              fileSize: photo.fileSize,
              attachmentType:
                AttachmentType.SUPPORTING_DOCUMENTATION_PHOTO,
              uploadedByType: UploadedByType.PUBLIC_CFI,
              uploadedByUserId: null,
            })),
          },
        },
      });

      await writeAuditLog(tx, {
        correctionRequestId: correctionRequest.id,
        publicActorName: input.submittedByName,
        publicActorIdentifier: input.instructorIdentifier,
        action: "PUBLIC_CORRECTION_SUBMITTED",
        newStatus: CorrectionStatus.SUBMITTED,
        ipAddress,
        userAgent,
      });

      await writeAuditLog(tx, {
        correctionRequestId: correctionRequest.id,
        publicActorName: input.submittedByName,
        publicActorIdentifier: input.instructorIdentifier,
        action: "CFI_SIGNATURE_CAPTURED",
        newStatus: CorrectionStatus.SUBMITTED,
        ipAddress,
        userAgent,
      });

      await writeAuditLog(tx, {
        correctionRequestId: correctionRequest.id,
        publicActorName: input.submittedByName,
        publicActorIdentifier: input.instructorIdentifier,
        action: "SUPPORTING_DOCUMENTATION_PHOTO_UPLOADED",
        newStatus: CorrectionStatus.SUBMITTED,
        comments: `${savedPhotos.length} supporting documentation photo(s) uploaded.`,
        ipAddress,
        userAgent,
      });

      await writeAuditLog(tx, {
        correctionRequestId: correctionRequest.id,
        action: "ROUTING_ASSIGNED",
        previousStatus: CorrectionStatus.SUBMITTED,
        newStatus: routing.status,
        comments: `Matched routing rules: ${routing.matchedRuleIds.join(", ") || "none"}`,
        ipAddress,
        userAgent,
      });

      for (const approval of routing.approvals) {
        await writeAuditLog(tx, {
          correctionRequestId: correctionRequest.id,
          action: "APPROVAL_REQUESTED",
          newStatus: routing.status,
          comments: `Approval requested from ${approval.role}`,
          ipAddress,
          userAgent,
        });
      }

      return {
        requestId: correctionRequest.id,
        requestNumber,
        directToRecords: routing.directToRecords,
      };
    });

    if (result.directToRecords) {
      await sendRequestToRecords(result.requestId);
    }

    return NextResponse.json(
      { requestNumber: result.requestNumber },
      { status: 201 },
    );
  } catch (error) {
    console.error("Public correction submission failed", error);
    return NextResponse.json(
      { error: "The request could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
