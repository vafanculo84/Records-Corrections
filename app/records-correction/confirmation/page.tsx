import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type ConfirmationPageProps = {
  searchParams: Promise<{ request?: string }>;
};

export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const requestNumber = /^RC-\d{6}$/.test(params.request ?? "")
    ? params.request
    : "Submitted";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-xl border-t-4 border-navy bg-white p-8 text-center shadow-lg sm:p-12">
        <CheckCircle2
          className="mx-auto text-emerald-700"
          aria-hidden="true"
          size={54}
        />
        <h1 className="mt-5 text-2xl font-extrabold text-navy sm:text-3xl">
          Your records correction request has been submitted.
        </h1>
        <div className="mt-7 border-y border-slate-300 py-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Request Number
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-wide text-navy">
            {requestNumber}
          </p>
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-600">
          Save this number for your records. Request details are not available
          publicly after submission.
        </p>
        <Link className="secondary-button mt-7" href="/records-correction">
          Submit another correction
        </Link>
      </section>
    </main>
  );
}
