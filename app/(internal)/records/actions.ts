"use server";

import { revalidatePath } from "next/cache";
import { CorrectionStatus, UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { canProcessRecords } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { sendRequestToRecords } from "@/lib/email";

export type RecordsActionState = {
  error?: string;
  success?: string;
};

export async function recordsAction(
  _previousState: RecordsActionState,
  formData: FormData,
): Promise<RecordsActionState> {
  const user = await requireSession([UserRole.RECORDS, UserRole.ADMIN]);
  if (!canProcessRecords(user.role)) {
    return { error: "You cannot process Records requests." };
  }

  const requestId = String(formData.get("requestId") ?? "");
  const action = String(formData.get("action") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const correctionPerformedByName = String(
    formData.get("correctionPerformedByName") ?? "",
  ).trim();

  const request = await db.correctionRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });
  if (!request) return { error: "Request not found." };

  if (action === "RESEND_EMAIL") {
    await sendRequestToRecords(requestId, user.id);
    revalidatePath(`/records/${requestId}`);
    return { success: "Records email processed." };
  }

  const now = new Date();
  let newStatus = request.status;
  let auditAction = "RECORDS_NOTES_UPDATED";
  const actionUpdate: {
    notes?: string | null;
    correctionPerformedByName?: string | null;
    recordsUserId?: string;
    printedAt?: Date;
    enteredIntoFileAt?: Date;
    completedAt?: Date;
  } = {
    recordsUserId: user.id,
    notes: notes || null,
    correctionPerformedByName: correctionPerformedByName || null,
  };

  if (action === "MARK_PRINTED") {
    newStatus = CorrectionStatus.PRINTED_BY_RECORDS;
    auditAction = "RECORDS_MARKED_PRINTED";
    actionUpdate.printedAt = now;
  } else if (action === "MARK_ENTERED") {
    newStatus = CorrectionStatus.ENTERED_INTO_STUDENT_FILE;
    auditAction = "RECORDS_MARKED_ENTERED_INTO_STUDENT_FILE";
    actionUpdate.enteredIntoFileAt = now;
  } else if (action === "MARK_COMPLETED") {
    if (!correctionPerformedByName) {
      return { error: "Correction performed by is required to complete." };
    }
    newStatus = CorrectionStatus.COMPLETED;
    auditAction = "RECORDS_MARKED_COMPLETED";
    actionUpdate.completedAt = now;
  } else if (action !== "SAVE_NOTES") {
    return { error: "Unknown Records action." };
  }

  await db.$transaction(async (tx) => {
    await tx.recordsAction.upsert({
      where: { correctionRequestId: requestId },
      create: { correctionRequestId: requestId, ...actionUpdate },
      update: actionUpdate,
    });
    await tx.correctionRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        completedAt:
          newStatus === CorrectionStatus.COMPLETED ? now : undefined,
        currentAssigneeRole:
          newStatus === CorrectionStatus.COMPLETED ? null : UserRole.RECORDS,
      },
    });
    await writeAuditLog(tx, {
      correctionRequestId: requestId,
      userId: user.id,
      action: auditAction,
      previousStatus: request.status,
      newStatus,
      comments: notes || undefined,
    });
  });

  revalidatePath(`/records/${requestId}`);
  revalidatePath("/records");
  revalidatePath("/dashboard");
  return { success: "Records action saved." };
}
