"use client";

import { useActionState, useCallback, useState } from "react";
import { Check, X } from "lucide-react";
import {
  approvalAction,
  type ApprovalActionState,
} from "@/app/(internal)/approvals/actions";
import { SignaturePad } from "@/components/SignaturePad";

const initialState: ApprovalActionState = {};

export function ApprovalActions({
  requestId,
  signatureRequired,
  commentsRequired,
}: {
  requestId: string;
  signatureRequired: boolean;
  commentsRequired: boolean;
}) {
  const [state, action, pending] = useActionState(
    approvalAction,
    initialState,
  );
  const [signature, setSignature] = useState("");
  const capture = useCallback((value: string) => setSignature(value), []);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="signatureDataUrl" value={signature} />
      <label className="block">
        <span className="form-label">
          Comments{commentsRequired ? " *" : ""}
        </span>
        <textarea
          name="comments"
          className="form-control mt-2 min-h-28"
          placeholder="Add approval or rejection comments"
        />
      </label>
      {signatureRequired ? (
        <SignaturePad
          label="Approver Signature"
          value={signature}
          onChange={capture}
        />
      ) : null}
      {state.error ? (
        <p className="text-sm font-semibold text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-semibold text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-emerald-700 px-5 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
          name="action"
          value="APPROVE"
          disabled={pending || (signatureRequired && !signature)}
          type="submit"
        >
          <Check aria-hidden="true" size={18} />
          Approve and Sign
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-red-700 bg-white px-5 font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          name="action"
          value="REJECT"
          disabled={pending}
          type="submit"
        >
          <X aria-hidden="true" size={18} />
          Reject
        </button>
      </div>
    </form>
  );
}
