import Image from "next/image";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { PdfPreview } from "@/components/PdfPreview";
import { RecordsActions } from "@/components/RecordsActions";
import { RequestTimeline } from "@/components/RequestTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { SupportingPhotoList } from "@/components/SupportingPhotoList";
import { requireSession } from "@/lib/auth";
import { ROLE_LABELS, SOURCE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";

type RecordsDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecordsDetailPage({
  params,
}: RecordsDetailPageProps) {
  await requireSession([UserRole.RECORDS, UserRole.ADMIN]);
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
      recordsAction: true,
      emailLogs: { orderBy: { createdAt: "desc" } },
      auditLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!request) notFound();

  return (
    <main>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold text-safety-orange">
            {request.requestNumber}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy">
            Records processing
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
              Correction request
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Student’s Name", request.studentName],
                ["Student ID", request.studentId],
                ["Transaction in Error", request.transactionInError],
                ["Aircraft Reg. #", request.aircraftRegistration],
                ["Source of Error", SOURCE_LABELS[request.sourceOfError]],
                ["CFI", request.submittedByName],
                ["Instructor Identifier", request.instructorIdentifier],
                ["Submitted publicly", request.submittedPublicly ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-200 pb-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {request.sourceOtherText ? (
              <p className="mt-4 text-sm">
                <strong>Other source:</strong> {request.sourceOtherText}
              </p>
            ) : null}
          </section>

          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">
              Supporting documentation photos
            </h2>
            <SupportingPhotoList
              attachments={request.attachments}
              allowDownload
            />
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
                    {ROLE_LABELS[approval.approverRole]} · {approval.status}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {approval.approverUser?.name ?? "Role assignment"}
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
            <h2 className="text-lg font-extrabold text-navy">Email log</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {request.emailLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-200">
                      <td className="p-3">{log.recipientEmail}</td>
                      <td className="p-3 font-semibold">{log.status}</td>
                      <td className="p-3">
                        {(log.sentAt ?? log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <h2 className="text-lg font-extrabold text-navy">Signatures</h2>
            <div className="mt-4 space-y-4">
              {request.signatures.map((signature) => (
                <div key={signature.id}>
                  <div className="relative h-32 border border-slate-300">
                    <Image
                      src={`/api/signatures/${signature.id}`}
                      alt={`Signature of ${signature.signerName}`}
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold">
                    {signature.signerName} · {signature.signerRole}
                  </p>
                  <p className="text-xs text-slate-500">
                    {signature.signedAt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">PDF</h2>
            <div className="mt-4">
              <PdfPreview requestId={request.id} />
            </div>
          </section>

          <section className="border-t-4 border-safety-orange bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">
              Records actions
            </h2>
            <div className="mt-4">
              <RecordsActions
                requestId={request.id}
                correctionPerformedByName={
                  request.recordsAction?.correctionPerformedByName
                }
                notes={request.recordsAction?.notes}
              />
            </div>
            {request.recordsAction ? (
              <dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Printed</dt>
                  <dd>
                    {request.recordsAction.printedAt?.toLocaleString() ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Entered into file</dt>
                  <dd>
                    {request.recordsAction.enteredIntoFileAt?.toLocaleString() ??
                      "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Completed</dt>
                  <dd>
                    {request.recordsAction.completedAt?.toLocaleString() ?? "—"}
                  </dd>
                </div>
              </dl>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
