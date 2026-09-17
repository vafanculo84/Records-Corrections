import type { AuditLog } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/constants";

type TimelineEntry = AuditLog & {
  user?: { name: string } | null;
};

export function RequestTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No audit entries yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="grid grid-cols-[18px_1fr] gap-3 border-b border-slate-200 py-4 last:border-0"
        >
          <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-navy" />
          <div>
            <div className="flex flex-col justify-between gap-1 sm:flex-row">
              <p className="text-sm font-bold text-navy">
                {entry.action.replaceAll("_", " ")}
              </p>
              <time className="text-xs text-slate-500">
                {entry.createdAt.toLocaleString()}
              </time>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {entry.user?.name ||
                entry.publicActorName ||
                "Automated workflow"}
              {entry.newStatus
                ? ` · ${STATUS_LABELS[entry.newStatus]}`
                : ""}
            </p>
            {entry.comments ? (
              <p className="mt-1 text-sm text-slate-700">{entry.comments}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
