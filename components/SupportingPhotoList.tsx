import Image from "next/image";
import { Download, FileImage } from "lucide-react";
import type { RequestAttachment } from "@prisma/client";

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function canPreview(mimeType: string) {
  return mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";
}

export function SupportingPhotoList({
  attachments,
  allowDownload = false,
}: {
  attachments: RequestAttachment[];
  allowDownload?: boolean;
}) {
  if (attachments.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-500">
        No supporting documentation photos found.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="border border-slate-300 bg-slate-50 p-3"
        >
          <div className="relative flex h-40 items-center justify-center overflow-hidden border border-slate-300 bg-white">
            {canPreview(attachment.mimeType) ? (
              <Image
                src={`/api/attachments/${attachment.id}`}
                alt={attachment.fileName}
                fill
                unoptimized
                className="object-contain p-2"
              />
            ) : (
              <FileImage aria-hidden="true" className="text-slate-500" size={40} />
            )}
          </div>
          <p className="mt-2 break-words text-sm font-bold text-navy">
            {attachment.fileName}
          </p>
          <p className="text-xs text-slate-500">
            {formatBytes(attachment.fileSize)} · {attachment.mimeType} · Uploaded{" "}
            {attachment.uploadedAt.toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className="text-button"
              href={`/api/attachments/${attachment.id}`}
              target="_blank"
              rel="noreferrer"
            >
              View
            </a>
            {allowDownload ? (
              <a
                className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-safety-orange"
                href={`/api/attachments/${attachment.id}?download=1`}
              >
                <Download aria-hidden="true" size={16} />
                Download
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
