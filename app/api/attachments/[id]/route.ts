import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readAttachment } from "@/lib/attachment-storage";
import { db } from "@/lib/db";
import {
  canAccessApproval,
  canViewAllRequests,
} from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const attachment = await db.requestAttachment.findUnique({
    where: { id },
    include: {
      correctionRequest: {
        include: { approvals: true },
      },
    },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed =
    canViewAllRequests(user.role) ||
    attachment.correctionRequest.approvals.some((approval) =>
      canAccessApproval(user, approval),
    );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bytes = await readAttachment(attachment.fileUrl);
  const disposition = new URL(request.url).searchParams.has("download")
    ? "attachment"
    : "inline";

  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": attachment.mimeType,
      "content-length": attachment.fileSize.toString(),
      "content-disposition": `${disposition}; filename="${attachment.fileName.replaceAll("\"", "'")}"`,
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
