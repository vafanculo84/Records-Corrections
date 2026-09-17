"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export async function manageUserAction(formData: FormData) {
  const actor = await requireSession([UserRole.ADMIN]);
  const action = String(formData.get("action") ?? "");

  if (action === "TOGGLE") {
    const id = String(formData.get("id") ?? "");
    const user = await db.user.findUniqueOrThrow({ where: { id } });
    await db.user.update({
      where: { id },
      data: { active: !user.active },
    });
    await writeAuditLog(db, {
      userId: actor.id,
      action: "ADMIN_CHANGED_USER",
      comments: `${user.email} active=${!user.active}`,
    });
  } else {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "") as UserRole;
    if (
      !name ||
      !email.includes("@") ||
      password.length < 10 ||
      !Object.values(UserRole).includes(role)
    ) {
      throw new Error("Invalid user details.");
    }
    await db.user.create({
      data: { name, email, passwordHash: await hash(password, 12), role },
    });
    await writeAuditLog(db, {
      userId: actor.id,
      action: "ADMIN_CREATED_USER",
      comments: `${email} · ${role}`,
    });
  }

  revalidatePath("/admin/users");
}
