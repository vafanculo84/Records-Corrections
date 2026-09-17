import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  canAccessApproval,
  canViewAllRequests,
} from "@/lib/permissions";
import { generateCorrectionPdf } from "@/lib/pdf";
import { writeAuditLog } from "@/lib/audit";

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
  const correctionRequest = await db.correctionRequest.findUnique({
    where: { id },
    include: {
      items: true,
      signatures: true,
      approvals: { include: { approverUser: true } },
      attachments: true,
      recordsAction: true,
    },
  });
  if (!correctionRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed =
    canViewAllRequests(user.role) ||
    correctionRequest.approvals.some((approval) =>
      canAccessApproval(user, approval),
    );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pdf = await generateCorrectionPdf(correctionRequest);
  await writeAuditLog(db, {
    correctionRequestId: correctionRequest.id,
    userId: user.id,
    action: "PDF_GENERATED",
    newStatus: correctionRequest.status,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${correctionRequest.requestNumber}.pdf"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
