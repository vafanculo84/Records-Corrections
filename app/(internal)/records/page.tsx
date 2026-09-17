import Link from "next/link";
import { CorrectionStatus, Prisma, UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";

type RecordsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function dateBoundary(value: string, endOfDay = false) {
  if (!value) return undefined;
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
}

export default async function RecordsPage({
  searchParams,
}: RecordsPageProps) {
  await requireSession([UserRole.RECORDS, UserRole.ADMIN]);
  const params = await searchParams;
  const statusValue = text(params.status);
  const status = Object.values(CorrectionStatus).includes(
    statusValue as CorrectionStatus,
  )
    ? (statusValue as CorrectionStatus)
    : undefined;

  const filters = {
    requestNumber: text(params.requestNumber),
    studentName: text(params.studentName),
    studentId: text(params.studentId),
    instructorIdentifier: text(params.instructorIdentifier),
    aircraftRegistration: text(params.aircraftRegistration),
    sourceOfError: text(params.sourceOfError),
    correctionItem: text(params.correctionItem),
    submittedFrom: text(params.submittedFrom),
    submittedTo: text(params.submittedTo),
    completedFrom: text(params.completedFrom),
    completedTo: text(params.completedTo),
  };

  const where: Prisma.CorrectionRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(filters.requestNumber
      ? {
          requestNumber: {
            contains: filters.requestNumber,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filters.studentName
      ? { studentName: { contains: filters.studentName, mode: "insensitive" } }
      : {}),
    ...(filters.studentId
      ? { studentId: { contains: filters.studentId, mode: "insensitive" } }
      : {}),
    ...(filters.instructorIdentifier
      ? {
          instructorIdentifier: {
            contains: filters.instructorIdentifier,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filters.aircraftRegistration
      ? {
          aircraftRegistration: {
            contains: filters.aircraftRegistration,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filters.sourceOfError
      ? { sourceOfError: filters.sourceOfError as never }
      : {}),
    ...(filters.correctionItem
      ? {
          items: {
            some: {
              OR: [
                {
                  incorrectItem: {
                    contains: filters.correctionItem,
                    mode: "insensitive",
                  },
                },
                {
                  customItemLabel: {
                    contains: filters.correctionItem,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        }
      : {}),
    ...(filters.submittedFrom || filters.submittedTo
      ? {
          submittedAt: {
            gte: dateBoundary(filters.submittedFrom),
            lte: dateBoundary(filters.submittedTo, true),
          },
        }
      : {}),
    ...(filters.completedFrom || filters.completedTo
      ? {
          completedAt: {
            gte: dateBoundary(filters.completedFrom),
            lte: dateBoundary(filters.completedTo, true),
          },
        }
      : {}),
  };

  const requests = await db.correctionRequest.findMany({
    where,
    include: { items: { orderBy: { sortOrder: "asc" }, take: 3 } },
    orderBy: { submittedAt: "desc" },
    take: 200,
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold text-navy">Records</h1>
      <p className="mt-2 text-slate-600">
        Search and process all records correction requests.
      </p>

      <form className="mt-7 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <label>
            <span className="form-label">Status</span>
            <select className="form-control mt-2" name="status" defaultValue={statusValue}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {[
            ["requestNumber", "Request number"],
            ["studentName", "Student name"],
            ["studentId", "Student ID"],
            ["instructorIdentifier", "Instructor identifier"],
            ["correctionItem", "Correction item"],
            ["aircraftRegistration", "Aircraft registration"],
          ].map(([name, label]) => (
            <label key={name}>
              <span className="form-label">{label}</span>
              <input
                className="form-control mt-2"
                name={name}
                defaultValue={filters[name as keyof typeof filters]}
              />
            </label>
          ))}
          <label>
            <span className="form-label">Source of error</span>
            <select
              className="form-control mt-2"
              name="sourceOfError"
              defaultValue={filters.sourceOfError}
            >
              <option value="">All sources</option>
              <option value="STUDENT_INSTRUCTOR">Student / Instructor</option>
              <option value="DATA_PROCESSOR">Data Processor</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          {[
            ["submittedFrom", "Submitted from"],
            ["submittedTo", "Submitted to"],
            ["completedFrom", "Completed from"],
            ["completedTo", "Completed to"],
          ].map(([name, label]) => (
            <label key={name}>
              <span className="form-label">{label}</span>
              <input
                className="form-control mt-2"
                type="date"
                name={name}
                defaultValue={filters[name as keyof typeof filters]}
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button className="primary-button" type="submit">
            Apply filters
          </button>
          <Link href="/records" className="secondary-button">
            Clear
          </Link>
        </div>
      </form>

      <section className="mt-7 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-navy">
            Requests ({requests.length})
          </h2>
          {requests.length === 200 ? (
            <p className="text-xs text-slate-500">Showing first 200 results</p>
          ) : null}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="border-y border-slate-300 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-3">Request</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Student ID</th>
                <th className="px-3 py-3">Instructor</th>
                <th className="px-3 py-3">Correction items</th>
                <th className="px-3 py-3">Submitted</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-slate-200">
                  <td className="px-3 py-3">
                    <Link
                      href={`/records/${request.id}`}
                      className="font-extrabold text-navy hover:underline"
                    >
                      {request.requestNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    {request.studentName}
                  </td>
                  <td className="px-3 py-3">{request.studentId}</td>
                  <td className="px-3 py-3">
                    {request.instructorIdentifier}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {request.items
                      .map((item) => item.customItemLabel || item.incorrectItem)
                      .join(", ")}
                  </td>
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
