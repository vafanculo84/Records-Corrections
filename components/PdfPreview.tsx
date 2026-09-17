import Link from "next/link";
import { Download } from "lucide-react";

export function PdfPreview({ requestId }: { requestId: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center border border-dashed border-slate-400 bg-slate-50 p-6 text-center">
      <p className="font-bold text-navy">Printable correction sheet</p>
      <p className="mt-1 text-sm text-slate-600">
        Generated from the submitted data, approvals, and signature images.
      </p>
      <Link
        href={`/api/records-correction/${requestId}/pdf`}
        className="secondary-button mt-4"
      >
        <Download aria-hidden="true" size={18} />
        Download PDF
      </Link>
    </div>
  );
}
