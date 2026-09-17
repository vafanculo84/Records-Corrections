import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  canAccessApproval,
  canViewAllRequests,
} from "@/lib/permissions";
import { readSignature } from "@/lib/signature-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const signature = await db.signature.findUnique({
    where: { id },
    include: {
      correctionRequest: {
        include: { approvals: true },
      },
    },
  });
  if (!signature) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed =
    canViewAllRequests(user.role) ||
    signature.correctionRequest.approvals.some((approval) =>
      canAccessApproval(user, approval),
    );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bytes = await readSignature(signature.signatureImageUrl);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": "image/png",
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
