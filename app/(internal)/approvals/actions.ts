"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ApprovalStatus,
  CorrectionStatus,
  SignerRole,
  UserRole,
} from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessApproval, canApprove } from "@/lib/permissions";
import { approvalActionSchema } from "@/lib/validation";
import { saveSignature } from "@/lib/signature-storage";
import { writeAuditLog } from "@/lib/audit";
import { sendRequestToRecords } from "@/lib/email";

export type ApprovalActionState = {
  error?: string;
  success?: string;
};

function signerRole(role: UserRole): SignerRole {
  switch (role) {
    case UserRole.LEAD_INSTRUCTOR:
      return SignerRole.LEAD_INSTRUCTOR;
    case UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR:
      return SignerRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR;
    case UserRole.RECORDS:
      return SignerRole.RECORDS;
    default:
      return SignerRole.ADMIN;
  }
}

function pendingStatus(roles: UserRole[]) {
  if (roles.length > 1 || new Set(roles).size > 1) {
    return CorrectionStatus.PENDING_MULTIPLE_APPROVALS;
  }
  if (roles[0] === UserRole.LEAD_INSTRUCTOR) {
    return CorrectionStatus.PENDING_LEAD_INSTRUCTOR_APPROVAL;
  }
  if (roles[0] === UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR) {
    return CorrectionStatus.PENDING_ASSISTANT_CHIEF_APPROVAL;
  }
  return CorrectionStatus.PENDING_APPROVAL;
}

function roleRequiresApprovalSignature(role: UserRole) {
  return (
    role === UserRole.LEAD_INSTRUCTOR ||
    role === UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR
  );
}

export async function approvalAction(
  _previousState: ApprovalActionState,
  formData: FormData,
): Promise<ApprovalActionState> {
  const user = await requireSession();
  if (!canApprove(user.role)) return { error: "You cannot approve requests." };

  const parsed = approvalActionSchema.safeParse({
    requestId: formData.get("requestId"),
    action: formData.get("action"),
    comments: formData.get("comments"),
    signatureDataUrl: formData.get("signatureDataUrl"),
  });
  if (!parsed.success) return { error: "Invalid approval action." };

  const isRejected = parsed.data.action === "REJECT";
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    undefined;
  const userAgent = requestHeaders.get("user-agent") || undefined;

  const pendingApprovals = await db.approval.findMany({
    where: {
      correctionRequestId: parsed.data.requestId,
      status: ApprovalStatus.PENDING,
    },
  });
  const approval = pendingApprovals.find((item) =>
    canAccessApproval(user, item),
  );
  if (!approval) return { error: "No assigned pending approval was found." };

  if ((approval.commentsRequired || isRejected) && !parsed.data.comments) {
    return { error: "Comments are required for this approval." };
  }
  const signatureRequired =
    !isRejected &&
    (approval.signatureRequired ||
      roleRequiresApprovalSignature(approval.approverRole));
  if (signatureRequired && !parsed.data.signatureDataUrl) {
    return { error: "Your signature is required for this approval." };
  }

  const signatureReference = !isRejected && parsed.data.signatureDataUrl
    ? await saveSignature(parsed.data.signatureDataUrl)
    : null;

  const outcome = await db.$transaction(async (tx) => {
    const request = await tx.correctionRequest.findUniqueOrThrow({
      where: { id: parsed.data.requestId },
      select: { status: true },
    });
    let signatureId: string | undefined;

    if (signatureReference) {
      const signature = await tx.signature.create({
        data: {
          correctionRequestId: parsed.data.requestId,
          userId: user.id,
          signerName: user.name,
          signerIdentifier: user.email,
          signerRole: signerRole(user.role),
          signatureImageUrl: signatureReference,
          ipAddress,
          userAgent,
          signatureReason: "APPROVAL_SIGNATURE",
        },
      });
      signatureId = signature.id;
    }

    await tx.approval.update({
      where: { id: approval.id },
      data: {
        approverUserId: user.id,
        status: isRejected
          ? ApprovalStatus.REJECTED
          : ApprovalStatus.APPROVED,
        comments: parsed.data.comments || null,
        signed: Boolean(signatureId),
        signatureId,
        actedAt: new Date(),
      },
    });

    const remaining = isRejected
      ? []
      : await tx.approval.findMany({
          where: {
            correctionRequestId: parsed.data.requestId,
            status: ApprovalStatus.PENDING,
          },
          select: { approverRole: true, approverUserId: true },
        });

    const newStatus = isRejected
      ? CorrectionStatus.REJECTED
      : remaining.length === 0
        ? CorrectionStatus.APPROVED_PENDING_RECORDS
        : pendingStatus(remaining.map((item) => item.approverRole));

    await tx.correctionRequest.update({
      where: { id: parsed.data.requestId },
        data: {
          status: newStatus,
          currentAssigneeRole:
            remaining.length === 0 ? UserRole.RECORDS : remaining[0]?.approverRole,
          currentAssigneeUserId:
            remaining.length === 1 ? remaining[0].approverUserId : null,
      },
    });

    await writeAuditLog(tx, {
      correctionRequestId: parsed.data.requestId,
      userId: user.id,
      action: isRejected ? "APPROVAL_REJECTED" : "APPROVAL_COMPLETED_WITH_SIGNATURE",
      previousStatus: request.status,
      newStatus,
      comments: parsed.data.comments || undefined,
      ipAddress,
      userAgent,
    });

    if (signatureId) {
      const roleAction =
        approval.approverRole === UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR
          ? "ASSISTANT_CHIEF_SIGNED_APPROVAL"
          : "LEAD_INSTRUCTOR_SIGNED_APPROVAL";
      await writeAuditLog(tx, {
        correctionRequestId: parsed.data.requestId,
        userId: user.id,
        action: roleAction,
        newStatus,
        ipAddress,
        userAgent,
      });
      await writeAuditLog(tx, {
        correctionRequestId: parsed.data.requestId,
        userId: user.id,
        action: "APPROVAL_SIGNATURE_CAPTURED",
        newStatus,
        ipAddress,
        userAgent,
      });
    }

    return { newStatus };
  });

  if (outcome.newStatus === CorrectionStatus.APPROVED_PENDING_RECORDS) {
    await sendRequestToRecords(parsed.data.requestId, user.id);
  }

  revalidatePath(`/approvals/${parsed.data.requestId}`);
  revalidatePath("/approvals");
  revalidatePath("/dashboard");

  return {
    success:
      outcome.newStatus === CorrectionStatus.REJECTED
        ? "Request rejected."
        : "Approval recorded.",
  };
}
