import type { CorrectionStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/constants";

const STATUS_STYLES: Record<CorrectionStatus, string> = {
  SUBMITTED: "bg-slate-100 text-slate-800",
  PENDING_APPROVAL: "bg-amber-100 text-amber-900",
  PENDING_LEAD_INSTRUCTOR_APPROVAL: "bg-amber-100 text-amber-900",
  PENDING_ASSISTANT_CHIEF_APPROVAL: "bg-amber-100 text-amber-900",
  PENDING_MULTIPLE_APPROVALS: "bg-amber-100 text-amber-900",
  APPROVED_PENDING_RECORDS: "bg-blue-100 text-blue-900",
  SENT_TO_RECORDS: "bg-blue-100 text-blue-900",
  PRINTED_BY_RECORDS: "bg-violet-100 text-violet-900",
  ENTERED_INTO_STUDENT_FILE: "bg-indigo-100 text-indigo-900",
  COMPLETED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-red-100 text-red-900",
};

export function StatusBadge({ status }: { status: CorrectionStatus }) {
  return (
    <span
      className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
