import Image from "next/image";
import { notFound } from "next/navigation";
import { ApprovalStatus, UserRole } from "@prisma/client";
import { ApprovalActions } from "@/components/ApprovalActions";
import { PdfPreview } from "@/components/PdfPreview";
import { RequestTimeline } from "@/components/RequestTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { SupportingPhotoList } from "@/components/SupportingPhotoList";
import { requireSession } from "@/lib/auth";
import { ROLE_LABELS, SOURCE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { canAccessApproval } from "@/lib/permissions";

type ApprovalDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApprovalDetailPage({
  params,
}: ApprovalDetailPageProps) {
  const user = await requireSession([
    UserRole.LEAD_INSTRUCTOR,
    UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
    UserRole.ADMIN,
  ]);
  const { id } = await params;
  const request = await db.correctionRequest.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      signatures: { orderBy: { signedAt: "asc" } },
      approvals: {
        include: { approverUser: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: { orderBy: { uploadedAt: "asc" } },
      auditLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!request) notFound();
  const assigned = request.approvals.filter((approval) =>
    canAccessApproval(user, approval),
  );
  if (user.role !== UserRole.ADMIN && assigned.length === 0) notFound();
  const pendingApproval = assigned.find(
    (approval) => approval.status === ApprovalStatus.PENDING,
  );
  const pendingApprovalSignatureRequired = pendingApproval
    ? pendingApproval.signatureRequired ||
      pendingApproval.approverRole === UserRole.LEAD_INSTRUCTOR ||
      pendingApproval.approverRole ===
        UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR
    : false;
  const cfiSignature = request.signatures.find(
    (signature) => signature.signerRole === "CFI",
  );

  return (
    <main>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold text-safety-orange">
            {request.requestNumber}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">
            Approval review
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Submitted {request.submittedAt.toLocaleString()}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_390px]">
        <div className="space-y-6">
          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">
              Student information
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["Student’s Name", request.studentName],
                ["Student ID", request.studentId],
                ["Transaction in Error", request.transactionInError],
                ["Aircraft Reg. #", request.aircraftRegistration],
                ["Source of Error", SOURCE_LABELS[request.sourceOfError]],
                [
                  "Instructor Identifier",
                  request.instructorIdentifier,
                ],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-200 pb-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {request.sourceOtherText ? (
              <p className="mt-4 text-sm text-slate-700">
                <strong>Other source:</strong> {request.sourceOtherText}
              </p>
            ) : null}
          </section>

          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">
              Supporting documentation photos
            </h2>
            <SupportingPhotoList attachments={request.attachments} />
          </section>

          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">
              Correction details
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-navy text-white">
                  <tr>
                    <th className="p-3">Incorrect Item</th>
                    <th className="p-3">Now Reads</th>
                    <th className="p-3">Should Read</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="p-3 font-semibold">
                        {item.customItemLabel || item.incorrectItem}
                      </td>
                      <td className="p-3">{item.nowReads || "—"}</td>
                      <td className="p-3">{item.shouldRead}</td>
                      <td className="p-3">{item.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">
              Approval history
            </h2>
            <div className="mt-4 space-y-3">
              {request.approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="border-l-4 border-slate-300 bg-slate-50 p-4"
                >
                  <p className="font-bold text-navy">
                    {ROLE_LABELS[approval.approverRole]}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {approval.status}
                    {approval.approverUser?.name
                      ? ` · ${approval.approverUser.name}`
                      : ""}
                    {approval.actedAt
                      ? ` · ${approval.actedAt.toLocaleString()}`
                      : ""}
                  </p>
                  {approval.comments ? (
                    <p className="mt-2 text-sm">{approval.comments}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">Audit log</h2>
            <div className="mt-3">
              <RequestTimeline entries={request.auditLogs} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">CFI signature</h2>
            {cfiSignature ? (
              <>
                <div className="relative mt-4 h-40 border border-slate-300 bg-white">
                  <Image
                    src={`/api/signatures/${cfiSignature.id}`}
                    alt={`Signature of ${cfiSignature.signerName}`}
                    fill
                    unoptimized
                    className="object-contain p-3"
                  />
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {cfiSignature.signerName} ·{" "}
                  {cfiSignature.signerIdentifier}
                </p>
                <p className="text-xs text-slate-500">
                  Signed {cfiSignature.signedAt.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No CFI signature found.
              </p>
            )}
          </section>

          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">PDF</h2>
            <div className="mt-4">
              <PdfPreview requestId={request.id} />
            </div>
          </section>

          {pendingApproval ? (
            <section className="border-t-4 border-safety-orange bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-navy">
                Approval action
              </h2>
              <div className="mt-4">
                <ApprovalActions
                  requestId={request.id}
                  signatureRequired={pendingApprovalSignatureRequired}
                  commentsRequired={pendingApproval.commentsRequired}
                />
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
