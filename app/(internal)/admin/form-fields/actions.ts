"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function manageFormFieldAction(formData: FormData) {
  const actor = await requireSession([UserRole.ADMIN]);
  const action = String(formData.get("action") ?? "");

  if (action === "UPDATE") {
    const id = String(formData.get("id") ?? "");
    const field = await db.formFieldConfig.update({
      where: { id },
      data: {
        active: formData.get("active") === "on",
        requiresNowReads: formData.get("requiresNowReads") === "on",
        requiresSignature: formData.get("requiresSignature") === "on",
        sortOrder: Number(formData.get("sortOrder") ?? 0),
      },
    });
    await writeAuditLog(db, {
      userId: actor.id,
      action: "ADMIN_CHANGED_FORM_FIELD",
      comments: `Updated ${field.fieldLabel}`,
    });
  } else {
    const label = String(formData.get("fieldLabel") ?? "").trim();
    if (!label) throw new Error("Label is required.");
    const count = await db.formFieldConfig.count({
      where: { fieldType: "correction_item" },
    });
    await db.formFieldConfig.create({
      data: {
        fieldKey: `correction_item:${label}`,
        fieldLabel: label,
        fieldType: "correction_item",
        active: true,
        requiresNowReads: formData.get("requiresNowReads") === "on",
        sortOrder: count,
      },
    });
    await writeAuditLog(db, {
      userId: actor.id,
      action: "ADMIN_CHANGED_FORM_FIELD",
      comments: `Created ${label}`,
    });
  }

  revalidatePath("/admin/form-fields");
  revalidatePath("/records-correction");
}
