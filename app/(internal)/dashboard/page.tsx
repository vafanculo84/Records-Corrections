import Link from "next/link";
import { UserRole } from "@prisma/client";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await requireSession();
  const isApprover =
    user.role === UserRole.LEAD_INSTRUCTOR ||
    user.role === UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR;

  const [pendingApprovals, openRecords, completed, recent] = await Promise.all([
    db.approval.count({
      where: {
        status: "PENDING",
        ...(isApprover
          ? {
              OR: [
                { approverUserId: user.id },
                { approverUserId: null, approverRole: user.role },
              ],
            }
          : user.role === UserRole.ADMIN
            ? {}
            : { id: "__none__" }),
      },
    }),
    db.correctionRequest.count({
      where: {
        status: {
          in: [
            "APPROVED_PENDING_RECORDS",
            "SENT_TO_RECORDS",
            "PRINTED_BY_RECORDS",
            "ENTERED_INTO_STUDENT_FILE",
          ],
        },
      },
    }),
    db.correctionRequest.count({ where: { status: "COMPLETED" } }),
    db.correctionRequest.findMany({
      take: 8,
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        requestNumber: true,
        studentName: true,
        status: true,
        submittedAt: true,
      },
    }),
  ]);

  return (
    <main>
      <p className="text-sm font-semibold text-safety-orange">
        {ROLE_LABELS[user.role]}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold text-navy">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Current workload and recent records correction activity.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="border-l-4 border-amber-500 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">
            Pending approvals
          </p>
          <p className="mt-2 text-3xl font-extrabold text-navy">
            {pendingApprovals}
          </p>
        </div>
        <div className="border-l-4 border-blue-600 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">
            In Records processing
          </p>
          <p className="mt-2 text-3xl font-extrabold text-navy">
            {openRecords}
          </p>
        </div>
        <div className="border-l-4 border-emerald-600 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Completed</p>
          <p className="mt-2 text-3xl font-extrabold text-navy">{completed}</p>
        </div>
      </div>

      <section className="mt-7 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold text-navy">Recent requests</h2>
          {user.role === UserRole.RECORDS || user.role === UserRole.ADMIN ? (
            <Link href="/records" className="text-sm font-bold text-navy hover:underline">
              View all
            </Link>
          ) : (
            <Link
              href="/approvals"
              className="text-sm font-bold text-navy hover:underline"
            >
              View approvals
            </Link>
          )}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y border-slate-300 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-3">Request</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Submitted</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((request) => (
                <tr key={request.id} className="border-b border-slate-200">
                  <td className="px-3 py-3 font-bold text-navy">
                    {request.requestNumber}
                  </td>
                  <td className="px-3 py-3">{request.studentName}</td>
                  <td className="px-3 py-3">
                    {request.submittedAt.toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={request.status} />
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
