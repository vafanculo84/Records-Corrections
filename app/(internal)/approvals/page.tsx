import Link from "next/link";
import { ApprovalStatus, UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";

export default async function ApprovalsPage() {
  const user = await requireSession([
    UserRole.LEAD_INSTRUCTOR,
    UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
    UserRole.ADMIN,
  ]);

  const assignment =
    user.role === UserRole.ADMIN
      ? {}
      : {
          OR: [
            { approverUserId: user.id },
            { approverUserId: null, approverRole: user.role },
          ],
        };

  const [pending, recent] = await Promise.all([
    db.approval.findMany({
      where: { status: ApprovalStatus.PENDING, ...assignment },
      include: {
        correctionRequest: {
          include: { items: { orderBy: { sortOrder: "asc" }, take: 3 } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.approval.findMany({
      where: {
        status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] },
        ...assignment,
      },
      include: { correctionRequest: true },
      orderBy: { actedAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold text-navy">Approvals</h1>
      <p className="mt-2 text-slate-600">
        Review records corrections assigned to you or your role.
      </p>

      <section className="mt-7 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">
          Pending review ({pending.length})
        </h2>
        <div className="mt-4 divide-y divide-slate-200">
          {pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No requests are waiting for your review.
            </p>
          ) : null}
          {pending.map((approval) => (
            <Link
              key={approval.id}
              href={`/approvals/${approval.correctionRequestId}`}
              className="grid gap-3 py-4 hover:bg-slate-50 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:px-2"
            >
              <span className="font-extrabold text-navy">
                {approval.correctionRequest.requestNumber}
              </span>
              <span>
                <span className="block font-semibold">
                  {approval.correctionRequest.studentName}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {approval.correctionRequest.items
                    .map((item) => item.customItemLabel || item.incorrectItem)
                    .join(", ")}
                </span>
              </span>
              <StatusBadge status={approval.correctionRequest.status} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Recently acted on</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y border-slate-300 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-3">Request</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((approval) => (
                <tr key={approval.id} className="border-b border-slate-200">
                  <td className="px-3 py-3">
                    <Link
                      href={`/approvals/${approval.correctionRequestId}`}
                      className="font-bold text-navy hover:underline"
                    >
                      {approval.correctionRequest.requestNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {approval.correctionRequest.studentName}
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    {approval.status}
                  </td>
                  <td className="px-3 py-3">
                    {approval.actedAt?.toLocaleDateString() ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
