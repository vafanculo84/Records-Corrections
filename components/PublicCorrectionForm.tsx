"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Image as ImageIcon, LockKeyhole, Send, Trash2 } from "lucide-react";
import {
  publicCorrectionSchema,
  type PublicCorrectionFormValues,
} from "@/lib/validation";
import { CorrectionItemTable } from "@/components/CorrectionItemTable";
import { SignaturePad } from "@/components/SignaturePad";

type PublicCorrectionFormProps = {
  correctionOptions: string[];
  nowReadsRequired: string[];
};

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

function todayForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function PublicCorrectionForm({
  correctionOptions,
  nowReadsRequired,
}: PublicCorrectionFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photoPreviewRef = useRef("");
  const methods = useForm<PublicCorrectionFormValues>({
    resolver: zodResolver(publicCorrectionSchema),
    mode: "onBlur",
    defaultValues: {
      studentName: "",
      studentId: "",
      transactionInError: "",
      aircraftRegistration: "",
      sourceOfError: "STUDENT_INSTRUCTOR",
      sourceOtherText: "",
      submittedByName: "",
      submittedByEmail: "",
      instructorIdentifier: "",
      dateSigned: todayForInput(),
      signatureDataUrl: "",
      correctionItems: [
        {
          incorrectItem: "",
          customItemLabel: "",
          nowReads: "",
          shouldRead: "",
          remarks: "",
        },
      ],
      website: "",
      turnstileToken: "",
    },
  });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;
  const sourceOfError = useWatch({
    control: methods.control,
    name: "sourceOfError",
  });
  const signatureValue = useWatch({
    control: methods.control,
    name: "signatureDataUrl",
  });

  const clearPhotoPreview = useCallback(() => {
    if (photoPreviewRef.current) {
      URL.revokeObjectURL(photoPreviewRef.current);
      photoPreviewRef.current = "";
    }
    setPhotoPreview("");
  }, []);

  useEffect(() => clearPhotoPreview, [clearPhotoPreview]);

  const handleSignature = useCallback(
    (dataUrl: string) => {
      setValue("signatureDataUrl", dataUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handlePhoto = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setPhoto(null);
    setPhotoError("");
    clearPhotoPreview();

    if (!selected) return;

    if (!ACCEPTED_PHOTO_TYPES.has(selected.type)) {
      setPhotoError("Upload a JPG, PNG, HEIC, or WebP photo.");
      event.target.value = "";
      return;
    }

    if (selected.size > MAX_PHOTO_BYTES) {
      setPhotoError("Supporting documentation photo must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setPhoto(selected);
    if (selected.type !== "image/heic" && selected.type !== "image/heif") {
      const previewUrl = URL.createObjectURL(selected);
      photoPreviewRef.current = previewUrl;
      setPhotoPreview(previewUrl);
    }
  }, [clearPhotoPreview]);

  const removePhoto = useCallback(() => {
    setPhoto(null);
    setPhotoError("");
    clearPhotoPreview();
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }, [clearPhotoPreview]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError("");
    setPhotoError("");

    if (!photo) {
      setPhotoError("Supporting documentation photo is required.");
      return;
    }

    const formData = new FormData();
    formData.append("payload", JSON.stringify(values));
    formData.append("supportingPhotos", photo);

    const response = await fetch("/api/public/records-correction", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as {
      requestNumber?: string;
      error?: string;
    };

    if (!response.ok || !result.requestNumber) {
      setSubmitError(result.error ?? "The request could not be submitted.");
      return;
    }

    router.push(
      `/records-correction/confirmation?request=${encodeURIComponent(result.requestNumber)}`,
    );
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-0" noValidate>
        <section className="form-section">
          <h2 className="section-title">1. Student Information</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="form-label">Student&apos;s Name *</span>
              <input
                className="form-control mt-2"
                autoComplete="off"
                placeholder="Enter student’s full name"
                {...register("studentName")}
              />
              {errors.studentName ? (
                <p className="form-error">{errors.studentName.message}</p>
              ) : null}
            </label>
            <label>
              <span className="form-label">Student Identification Number *</span>
              <input
                className="form-control mt-2"
                autoComplete="off"
                placeholder="Enter student ID number"
                {...register("studentId")}
              />
              {errors.studentId ? (
                <p className="form-error">{errors.studentId.message}</p>
              ) : null}
            </label>
            <label>
              <span className="form-label">Transaction in Error *</span>
              <input
                className="form-control mt-2"
                placeholder="Enter transaction"
                {...register("transactionInError")}
              />
              {errors.transactionInError ? (
                <p className="form-error">
                  {errors.transactionInError.message}
                </p>
              ) : null}
            </label>
            <label>
              <span className="form-label">Aircraft Reg. # *</span>
              <input
                className="form-control mt-2 uppercase"
                placeholder="N123AB"
                {...register("aircraftRegistration")}
              />
              {errors.aircraftRegistration ? (
                <p className="form-error">
                  {errors.aircraftRegistration.message}
                </p>
              ) : null}
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2 className="section-title">2. Source of Error</h2>
          <fieldset>
            <legend className="sr-only">Select source of error</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["STUDENT_INSTRUCTOR", "Student / Instructor"],
                ["DATA_PROCESSOR", "Data Processor"],
                ["OTHER", "Other"],
              ].map(([value, label]) => (
                <label className="radio-option" key={value}>
                  <input
                    type="radio"
                    value={value}
                    {...register("sourceOfError")}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {sourceOfError === "OTHER" ? (
            <label className="mt-5 block">
              <span className="form-label">Other source explanation *</span>
              <textarea
                className="form-control mt-2 min-h-24"
                placeholder="Explain the source of the error"
                {...register("sourceOtherText")}
              />
              {errors.sourceOtherText ? (
                <p className="form-error">{errors.sourceOtherText.message}</p>
              ) : null}
            </label>
          ) : null}
        </section>

        <section className="form-section">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <h2 className="section-title mb-0">3. Correction Details</h2>
            <p className="text-sm text-slate-600">
              All asterisk items (*) require a value in “Now Reads.”
            </p>
          </div>
          <CorrectionItemTable
            options={correctionOptions}
            nowReadsRequired={nowReadsRequired}
          />
        </section>

        <section className="form-section">
          <h2 className="section-title">4. Supporting Documentation</h2>
          <label className="block">
            <span className="form-label">
              Supporting Documentation Photo *
            </span>
            <input
              className="form-control mt-2"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
              onChange={handlePhoto}
              ref={photoInputRef}
            />
          </label>
          <p className="mt-2 text-sm text-slate-600">
            Upload a JPG, PNG, HEIC, or WebP photo up to 10 MB.
          </p>
          {photoError ? (
            <p className="form-error" role="alert">
              {photoError}
            </p>
          ) : null}
          {photo ? (
            <div className="mt-4 flex flex-col gap-4 border border-slate-300 bg-white p-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border border-slate-300 bg-slate-50">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="Supporting documentation preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon
                    aria-hidden="true"
                    className="text-slate-500"
                    size={34}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-navy">{photo.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {(photo.size / (1024 * 1024)).toFixed(2)} MB · {photo.type}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-red-700 bg-white px-4 text-sm font-bold text-red-700 hover:bg-red-50"
                onClick={removePhoto}
              >
                <Trash2 aria-hidden="true" size={17} />
                Remove
              </button>
            </div>
          ) : null}
        </section>

        <section className="form-section">
          <h2 className="section-title">5. Instructor Verification</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="form-label">Instructor Name *</span>
              <input
                className="form-control mt-2"
                autoComplete="name"
                {...register("submittedByName")}
              />
              {errors.submittedByName ? (
                <p className="form-error">{errors.submittedByName.message}</p>
              ) : null}
            </label>
            <label>
              <span className="form-label">Instructor Identifier *</span>
              <input
                className="form-control mt-2"
                autoComplete="off"
                {...register("instructorIdentifier")}
              />
              {errors.instructorIdentifier ? (
                <p className="form-error">
                  {errors.instructorIdentifier.message}
                </p>
              ) : null}
            </label>
            <label>
              <span className="form-label">Email (optional)</span>
              <input
                className="form-control mt-2"
                type="email"
                autoComplete="email"
                placeholder="instructor@example.com"
                {...register("submittedByEmail")}
              />
              {errors.submittedByEmail ? (
                <p className="form-error">
                  {errors.submittedByEmail.message}
                </p>
              ) : null}
            </label>
            <label>
              <span className="form-label">Date Signed *</span>
              <input
                className="form-control mt-2"
                type="date"
                {...register("dateSigned")}
              />
              {errors.dateSigned ? (
                <p className="form-error">{errors.dateSigned.message}</p>
              ) : null}
            </label>
          </div>
          <div className="mt-6">
            <SignaturePad
              value={signatureValue}
              onChange={handleSignature}
              error={errors.signatureDataUrl?.message}
            />
          </div>
        </section>

        <div className="flex flex-col gap-5 border-t border-navy/40 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-3">
          <div className="flex max-w-xl items-start gap-3 text-sm text-slate-600">
            <LockKeyhole
              className="mt-0.5 shrink-0 text-navy"
              aria-hidden="true"
              size={20}
            />
            <p>
              This submission is locked after it is sent. It is used only to
              process and document the requested flight-record correction.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {submitError ? (
              <p className="text-sm font-medium text-red-700" role="alert">
                {submitError}
              </p>
            ) : null}
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              <Send aria-hidden="true" size={19} />
              {isSubmitting ? "Submitting…" : "Submit correction request"}
            </button>
          </div>
        </div>

        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" {...register("website")} />
          </label>
        </div>
      </form>
    </FormProvider>
  );
}
