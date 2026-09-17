"use client";

import {
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { PublicCorrectionFormValues } from "@/lib/validation";

type CorrectionItemTableProps = {
  options: string[];
  nowReadsRequired: string[];
};

type CorrectionItemRowProps = CorrectionItemTableProps & {
  index: number;
  rowId: string;
  rowCount: number;
  move: (from: number, to: number) => void;
  remove: (index: number) => void;
};

const EMPTY_ROW = {
  incorrectItem: "",
  customItemLabel: "",
  nowReads: "",
  shouldRead: "",
  remarks: "",
};

function CorrectionItemRow({
  index,
  rowId,
  rowCount,
  options,
  nowReadsRequired,
  move,
  remove,
}: CorrectionItemRowProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<PublicCorrectionFormValues>();
  const selected =
    useWatch({
      control,
      name: `correctionItems.${index}.incorrectItem`,
    }) ?? "";
  const needsNowReads = nowReadsRequired.includes(selected);
  const itemErrors = errors.correctionItems?.[index];

  return (
    <div
      className="grid gap-4 border border-slate-300 bg-white p-4 lg:grid-cols-[46px_1.15fr_1fr_1fr_1.15fr_104px] lg:gap-0 lg:border-x lg:border-b lg:border-t-0 lg:p-0"
      data-testid={`correction-row-${index + 1}`}
    >
      <div className="flex items-center justify-between lg:block lg:p-3 lg:text-center">
        <h3 className="font-semibold text-navy lg:text-sm lg:text-slate-600">
          <span className="lg:hidden">Correction </span>
          {index + 1}
        </h3>
        <div className="flex gap-1 lg:hidden">
          <button
            className="icon-button"
            type="button"
            disabled={index === 0}
            onClick={() => move(index, index - 1)}
            aria-label={`Move correction ${index + 1} up`}
          >
            <ArrowUp size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            disabled={index === rowCount - 1}
            onClick={() => move(index, index + 1)}
            aria-label={`Move correction ${index + 1} down`}
          >
            <ArrowDown size={17} />
          </button>
          <button
            className="icon-button text-red-700"
            type="button"
            disabled={rowCount === 1}
            onClick={() => remove(index)}
            aria-label={`Delete correction ${index + 1}`}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <div className="lg:border-l lg:border-slate-300 lg:p-2">
        <label htmlFor={`${rowId}-item`} className="form-label lg:sr-only">
          Incorrect Item *
        </label>
        <select
          id={`${rowId}-item`}
          className="form-control mt-2 lg:mt-0"
          aria-label={`Incorrect item ${index + 1}`}
          {...register(`correctionItems.${index}.incorrectItem`)}
        >
          <option value="">Select item</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
              {nowReadsRequired.includes(option) ? " *" : ""}
            </option>
          ))}
        </select>
        {selected === "Other" ? (
          <>
            <label
              htmlFor={`${rowId}-custom-item`}
              className="form-label mt-3 lg:sr-only"
            >
              Custom item label *
            </label>
            <input
              id={`${rowId}-custom-item`}
              className="form-control mt-2"
              placeholder="Custom item label"
              {...register(`correctionItems.${index}.customItemLabel`)}
            />
          </>
        ) : null}
        {itemErrors?.incorrectItem?.message ? (
          <p className="form-error">{itemErrors.incorrectItem.message}</p>
        ) : null}
        {itemErrors?.customItemLabel?.message ? (
          <p className="form-error">{itemErrors.customItemLabel.message}</p>
        ) : null}
      </div>

      <div className="lg:border-l lg:border-slate-300 lg:p-2">
        <label htmlFor={`${rowId}-now-reads`} className="form-label lg:sr-only">
          Now Reads{needsNowReads ? " *" : ""}
        </label>
        <input
          id={`${rowId}-now-reads`}
          className="form-control mt-2 lg:mt-0"
          aria-label={`Now reads ${index + 1}`}
          placeholder={needsNowReads ? "Required" : "Current value"}
          {...register(`correctionItems.${index}.nowReads`)}
        />
        {itemErrors?.nowReads?.message ? (
          <p className="form-error">{itemErrors.nowReads.message}</p>
        ) : null}
      </div>

      <div className="lg:border-l lg:border-slate-300 lg:p-2">
        <label
          htmlFor={`${rowId}-should-read`}
          className="form-label lg:sr-only"
        >
          Should Read *
        </label>
        <input
          id={`${rowId}-should-read`}
          className="form-control mt-2 lg:mt-0"
          aria-label={`Should read ${index + 1}`}
          placeholder="Correct value"
          {...register(`correctionItems.${index}.shouldRead`)}
        />
        {itemErrors?.shouldRead?.message ? (
          <p className="form-error">{itemErrors.shouldRead.message}</p>
        ) : null}
      </div>

      <div className="lg:border-l lg:border-slate-300 lg:p-2">
        <label htmlFor={`${rowId}-remarks`} className="form-label lg:sr-only">
          Remarks{selected === "Other" ? " *" : ""}
        </label>
        <textarea
          id={`${rowId}-remarks`}
          className="form-control mt-2 min-h-24 resize-y lg:mt-0 lg:min-h-11"
          aria-label={`Remarks ${index + 1}`}
          placeholder={
            selected === "Other"
              ? "Required for Other"
              : "Additional remarks"
          }
          {...register(`correctionItems.${index}.remarks`)}
        />
        {itemErrors?.remarks?.message ? (
          <p className="form-error">{itemErrors.remarks.message}</p>
        ) : null}
      </div>

      <div className="hidden items-center justify-center gap-1 border-l border-slate-300 p-2 lg:flex">
        <button
          className="icon-button"
          type="button"
          aria-label={`Move correction ${index + 1} up`}
          disabled={index === 0}
          onClick={() => move(index, index - 1)}
        >
          <ArrowUp size={16} />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={`Move correction ${index + 1} down`}
          disabled={index === rowCount - 1}
          onClick={() => move(index, index + 1)}
        >
          <ArrowDown size={16} />
        </button>
        <button
          className="icon-button text-red-700"
          type="button"
          aria-label={`Delete correction ${index + 1}`}
          disabled={rowCount === 1}
          onClick={() => remove(index)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export function CorrectionItemTable({
  options,
  nowReadsRequired,
}: CorrectionItemTableProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<PublicCorrectionFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "correctionItems",
  });

  return (
    <div>
      <div className="hidden grid-cols-[46px_1.15fr_1fr_1fr_1.15fr_104px] bg-navy text-sm font-semibold text-white lg:grid">
        <div className="p-3 text-center">#</div>
        <div className="border-l border-white/30 p-3">Incorrect Item</div>
        <div className="border-l border-white/30 p-3">Now Reads</div>
        <div className="border-l border-white/30 p-3">Should Read</div>
        <div className="border-l border-white/30 p-3">Remarks</div>
        <div className="border-l border-white/30 p-3 text-center">Order</div>
      </div>

      <div className="space-y-4 lg:space-y-0">
        {fields.map((field, index) => (
          <CorrectionItemRow
            key={field.id}
            rowId={`correction-item-${index}`}
            index={index}
            rowCount={fields.length}
            options={options}
            nowReadsRequired={nowReadsRequired}
            move={move}
            remove={remove}
          />
        ))}
      </div>

      <button
        className="secondary-button mt-4"
        type="button"
        onClick={() => append({ ...EMPTY_ROW })}
      >
        <Plus aria-hidden="true" size={18} />
        Add correction row
      </button>
      {errors.correctionItems?.message ? (
        <p className="form-error">{errors.correctionItems.message}</p>
      ) : null}
    </div>
  );
}
