import nodemailer from "nodemailer";
import { CorrectionStatus, EmailStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { generateCorrectionPdf } from "@/lib/pdf";
import { STATUS_LABELS } from "@/lib/constants";
import { writeAuditLog } from "@/lib/audit";

function smtpTransport() {
  if (process.env.EMAIL_MODE !== "smtp") return null;
  if (!process.env.SMTP_HOST) {
    throw new Error("SMTP_HOST is required when EMAIL_MODE=smtp.");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  });
}

export async function sendRequestToRecords(
  requestId: string,
  actorUserId?: string,
) {
  const correctionRequest = await db.correctionRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: {
      items: true,
      signatures: true,
      approvals: { include: { approverUser: true } },
      attachments: true,
      recordsAction: true,
    },
  });
  const settings = await db.emailSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      recordsRecipientEmail: "records@example.com",
    },
  });
  const subject = `Records Correction Ready: ${correctionRequest.requestNumber} - ${correctionRequest.studentName}`;
  const dashboardUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/records/${correctionRequest.id}`;
  const body = [
    "A records correction has been approved and is ready for Records processing.",
    "",
    `Request Number: ${correctionRequest.requestNumber}`,
    `Student: ${correctionRequest.studentName}`,
    `Student ID: ${correctionRequest.studentId}`,
    `Instructor Identifier: ${correctionRequest.instructorIdentifier}`,
    `Status: ${STATUS_LABELS[CorrectionStatus.APPROVED_PENDING_RECORDS]}`,
    "",
    "The completed records correction PDF is attached.",
    "",
    `View the request in the Records dashboard: ${dashboardUrl}`,
  ].join("\n");
  const emailLog = await db.emailLog.create({
    data: {
      correctionRequestId: requestId,
      recipientEmail: settings.recordsRecipientEmail,
      recipientRole: UserRole.RECORDS,
      subject,
      status: EmailStatus.PENDING,
    },
  });

  try {
    const pdf = await generateCorrectionPdf(correctionRequest);
    await writeAuditLog(db, {
      correctionRequestId: requestId,
      userId: actorUserId,
      action: "PDF_GENERATED",
      newStatus: correctionRequest.status,
    });

    const transport = smtpTransport();
    if (transport) {
      await transport.sendMail({
        from:
          process.env.SMTP_FROM ??
          "Flight School Records <no-reply@example.com>",
        to: settings.recordsRecipientEmail,
        subject,
        text: body,
        attachments: [
          {
            filename: `${correctionRequest.requestNumber}.pdf`,
            content: Buffer.from(pdf),
            contentType: "application/pdf",
          },
        ],
      });
    } else {
      console.info(`[EMAIL_MODE=log] ${subject}\nTo: ${settings.recordsRecipientEmail}`);
    }

    const now = new Date();
    await db.$transaction(async (tx) => {
      await tx.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: transport ? EmailStatus.SENT : EmailStatus.SKIPPED,
          sentAt: now,
        },
      });
      await tx.correctionRequest.update({
        where: { id: requestId },
        data: {
          status: CorrectionStatus.SENT_TO_RECORDS,
          sentToRecordsAt: now,
          currentAssigneeRole: UserRole.RECORDS,
          currentAssigneeUserId: null,
        },
      });
      await tx.recordsAction.upsert({
        where: { correctionRequestId: requestId },
        create: { correctionRequestId: requestId, pdfSentAt: now },
        update: { pdfSentAt: now },
      });
      await writeAuditLog(tx, {
        correctionRequestId: requestId,
        userId: actorUserId,
        action: "PDF_EMAILED_TO_RECORDS",
        previousStatus: correctionRequest.status,
        newStatus: CorrectionStatus.SENT_TO_RECORDS,
        comments: transport
          ? `Sent to ${settings.recordsRecipientEmail}`
          : `Logged for ${settings.recordsRecipientEmail}; SMTP is disabled locally`,
      });
    });

    return { sent: Boolean(transport), recipient: settings.recordsRecipientEmail };
  } catch (error) {
    await db.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
