"use server";

import { revalidatePath } from "next/cache";
import { SourceOfError, UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function manageRoutingRuleAction(formData: FormData) {
  const actor = await requireSession([UserRole.ADMIN]);
  const action = String(formData.get("action") ?? "");

  if (action === "TOGGLE") {
    const id = String(formData.get("id") ?? "");
    const rule = await db.routingRule.findUniqueOrThrow({ where: { id } });
    await db.routingRule.update({
      where: { id },
      data: { active: !rule.active },
    });
    await writeAuditLog(db, {
      userId: actor.id,
      action: "ADMIN_CHANGED_ROUTING_RULE",
      comments: `${rule.name} active=${!rule.active}`,
    });
  } else {
    const roleValue = String(formData.get("requiredRole") ?? "");
    const sourceValue = String(formData.get("sourceOfError") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("Rule name is required.");
    await db.routingRule.create({
      data: {
        name,
        correctionItem: String(formData.get("correctionItem") ?? "").trim() || null,
        sourceOfError: Object.values(SourceOfError).includes(sourceValue as SourceOfError)
          ? (sourceValue as SourceOfError)
          : null,
        instructorIdentifier:
          String(formData.get("instructorIdentifier") ?? "").trim() || null,
        requiredRole: Object.values(UserRole).includes(roleValue as UserRole)
          ? (roleValue as UserRole)
          : null,
        requiredSpecificUserId:
          String(formData.get("requiredSpecificUserId") ?? "") || null,
        signatureRequired: formData.get("signatureRequired") === "on",
        commentsRequired: formData.get("commentsRequired") === "on",
        sendDirectlyToRecords: formData.get("sendDirectlyToRecords") === "on",
        sendToRecordsAfterApproval: true,
        sortOrder: Number(formData.get("sortOrder") ?? 100),
      },
    });
    await writeAuditLog(db, {
      userId: actor.id,
      action: "ADMIN_CHANGED_ROUTING_RULE",
      comments: `Created ${name}`,
    });
  }

  revalidatePath("/admin/routing-rules");
}
