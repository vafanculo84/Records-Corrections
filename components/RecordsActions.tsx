"use client";

import { useActionState } from "react";
import {
  CheckCircle2,
  FileCheck2,
  Mail,
  Printer,
  Save,
} from "lucide-react";
import {
  recordsAction,
  type RecordsActionState,
} from "@/app/(internal)/records/actions";

const initialState: RecordsActionState = {};

export function RecordsActions({
  requestId,
  correctionPerformedByName,
  notes,
}: {
  requestId: string;
  correctionPerformedByName?: string | null;
  notes?: string | null;
}) {
  const [state, action, pending] = useActionState(recordsAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="requestId" value={requestId} />
      <label className="block">
        <span className="form-label">Correction performed by</span>
        <input
          className="form-control mt-2"
          name="correctionPerformedByName"
          defaultValue={correctionPerformedByName ?? ""}
        />
      </label>
      <label className="block">
        <span className="form-label">Records notes</span>
        <textarea
          className="form-control mt-2 min-h-28"
          name="notes"
          defaultValue={notes ?? ""}
        />
      </label>
      {state.error ? (
        <p className="text-sm font-semibold text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-semibold text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className="secondary-button"
          name="action"
          value="SAVE_NOTES"
          disabled={pending}
        >
          <Save size={17} />
          Save notes
        </button>
        <button
          className="secondary-button"
          name="action"
          value="RESEND_EMAIL"
          disabled={pending}
        >
          <Mail size={17} />
          Re-send PDF email
        </button>
        <button
          className="secondary-button"
          name="action"
          value="MARK_PRINTED"
          disabled={pending}
        >
          <Printer size={17} />
          Mark printed
        </button>
        <button
          className="secondary-button"
          name="action"
          value="MARK_ENTERED"
          disabled={pending}
        >
          <FileCheck2 size={17} />
          Mark entered
        </button>
        <button
          className="primary-button sm:col-span-2"
          name="action"
          value="MARK_COMPLETED"
          disabled={pending}
        >
          <CheckCircle2 size={18} />
          Mark completed
        </button>
      </div>
    </form>
  );
}
