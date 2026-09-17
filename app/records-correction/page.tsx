import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { PublicCorrectionForm } from "@/components/PublicCorrectionForm";
import {
  DEFAULT_CORRECTION_ITEMS,
  NOW_READS_REQUIRED_ITEMS,
} from "@/lib/constants";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function correctionOptions() {
  try {
    const configured = await db.formFieldConfig.findMany({
      where: { fieldType: "correction_item", active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        fieldLabel: true,
        requiresNowReads: true,
      },
    });

    if (configured.length === 0) throw new Error("No configured options");

    return {
      options: configured.map((item) => item.fieldLabel),
      nowReadsRequired: configured
        .filter((item) => item.requiresNowReads)
        .map((item) => item.fieldLabel),
    };
  } catch {
    return {
      options: [...DEFAULT_CORRECTION_ITEMS],
      nowReadsRequired: [...NOW_READS_REQUIRED_ITEMS],
    };
  }
}

export default async function RecordsCorrectionPage() {
  const options = await correctionOptions();

  return (
    <main className="min-h-screen bg-slate-100 px-0 py-0 sm:px-4 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-[1480px] bg-white shadow-[0_1px_8px_rgb(15_23_42/10%)]">
        <header className="flex items-center justify-between border-b-2 border-navy px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-navy">
            <div className="flex h-10 w-10 items-center justify-center bg-navy text-white">
              <FilePenLine aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-[0.025em]">
                FLIGHT SCHOOL
              </p>
              <p className="text-xs font-semibold tracking-[0.13em] text-slate-500">
                RECORDS
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-navy underline-offset-4 hover:underline"
          >
            Internal login
          </Link>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-3 lg:py-7">
          <div className="lg:px-5">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Record Correction Sheet
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
              This form is only for Flight Record corrections. There is a
              separate form for Billing errors.
            </p>
          </div>
        </div>

        <PublicCorrectionForm
          correctionOptions={options.options}
          nowReadsRequired={options.nowReadsRequired}
        />
      </div>
    </main>
  );
}
