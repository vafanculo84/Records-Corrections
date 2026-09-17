"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function updateEmailSettingsAction(formData: FormData) {
  const actor = await requireSession([UserRole.ADMIN]);
  const email = String(formData.get("recordsRecipientEmail") ?? "").trim();
  if (!email.includes("@")) throw new Error("A valid Records email is required.");

  await db.emailSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      recordsRecipientEmail: email,
      approvalNotifications: formData.get("approvalNotifications") === "on",
      recordsNotifications: formData.get("recordsNotifications") === "on",
    },
    update: {
      recordsRecipientEmail: email,
      approvalNotifications: formData.get("approvalNotifications") === "on",
      recordsNotifications: formData.get("recordsNotifications") === "on",
    },
  });
  await writeAuditLog(db, {
    userId: actor.id,
    action: "ADMIN_CHANGED_EMAIL_SETTINGS",
    comments: `Records recipient: ${email}`,
  });
  revalidatePath("/admin/email-settings");
}
