import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { Prisma } from "@prisma/client";
import { NOW_READS_REQUIRED_ITEMS, SOURCE_LABELS } from "@/lib/constants";
import { readSignature } from "@/lib/signature-storage";

export type PdfCorrectionRequest = Prisma.CorrectionRequestGetPayload<{
  include: {
    items: true;
    signatures: true;
    approvals: { include: { approverUser: true } };
    attachments: true;
    recordsAction: true;
  };
}>;

const BLACK = rgb(0, 0, 0);
const LIGHT = rgb(0.92, 0.93, 0.95);
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 28;

function wrapText(text: string, font: PDFFont, size: number, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCell(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    font: PDFFont;
    size?: number;
    bold?: boolean;
    align?: "left" | "center";
    fill?: ReturnType<typeof rgb>;
    borderWidth?: number;
    padding?: number;
  },
) {
  const {
    x,
    y,
    width,
    height,
    text = "",
    font,
    size = 8,
    align = "left",
    fill,
    borderWidth = 0.8,
    padding = 4,
  } = options;

  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: fill,
    borderColor: BLACK,
    borderWidth,
  });

  const lines = wrapText(text, font, size, width - padding * 2).slice(
    0,
    Math.max(1, Math.floor((height - padding * 2) / (size + 1))),
  );
  lines.forEach((line, index) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: align === "center" ? x + (width - lineWidth) / 2 : x + padding,
      y: y - padding - size - index * (size + 1),
      size,
      font,
      color: BLACK,
    });
  });
}

async function drawSignatureImage(
  pdf: PDFDocument,
  page: PDFPage,
  reference: string | undefined,
  box: { x: number; y: number; width: number; height: number },
) {
  if (!reference) return;
  try {
    const bytes = await readSignature(reference);
    const image = await pdf.embedPng(bytes);
    const scale = Math.min(
      (box.width - 8) / image.width,
      (box.height - 8) / image.height,
    );
    page.drawImage(image, {
      x: box.x + (box.width - image.width * scale) / 2,
      y: box.y - box.height + (box.height - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale,
    });
  } catch {
    // The remaining PDF is still usable if a stored image is unavailable.
  }
}

export async function generateCorrectionPdf(request: PdfCorrectionRequest) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Record Correction Sheet ${request.requestNumber}`);
  pdf.setSubject("Flight record correction");
  pdf.setCreator("Flight School Records Correction");

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = PAGE_HEIGHT - MARGIN;
  const contentWidth = PAGE_WIDTH - MARGIN * 2;

  page.drawText("RECORD CORRECTION SHEET", {
    x: MARGIN,
    y: y - 22,
    size: 20,
    font: bold,
    color: BLACK,
  });
  y -= 31;
  page.drawText(
    "Note: This form is only for Flight Record corrections. There is a separate form for Billing errors.",
    { x: MARGIN, y: y - 8, size: 8, font: regular, color: BLACK },
  );
  y -= 18;

  const half = contentWidth / 2;
  const labelHeight = 15;
  const valueHeight = 22;
  const studentRows = [
    [
      ["Student's Name:", request.studentName],
      ["Transaction in Error:", request.transactionInError],
    ],
    [
      ["Student Identification Number:", request.studentId],
      ["Aircraft Reg. #:", request.aircraftRegistration],
    ],
  ] as const;

  for (const row of studentRows) {
    row.forEach(([label], column) =>
      drawCell(page, {
        x: MARGIN + column * half,
        y,
        width: half,
        height: labelHeight,
        text: label,
        font: regular,
        size: 7.5,
        borderWidth: 1.2,
      }),
    );
    y -= labelHeight;
    row.forEach(([, value], column) =>
      drawCell(page, {
        x: MARGIN + column * half,
        y,
        width: half,
        height: valueHeight,
        text: value,
        font: bold,
        size: 11,
        align: "center",
        borderWidth: 1.2,
      }),
    );
    y -= valueHeight;
  }

  y -= 10;
  page.drawText("Source of Error", {
    x: MARGIN + 3,
    y: y - 14,
    size: 14,
    font: bold,
  });
  y -= 24;
  const sourceText =
    request.sourceOfError === "OTHER"
      ? `${SOURCE_LABELS[request.sourceOfError]}: ${request.sourceOtherText ?? ""}`
      : SOURCE_LABELS[request.sourceOfError];
  drawCell(page, {
    x: MARGIN,
    y,
    width: contentWidth,
    height: 24,
    text: `A. ${request.sourceOfError === "STUDENT_INSTRUCTOR" ? "X" : " "}  STUDENT / INSTRUCTOR     B. ${request.sourceOfError === "DATA_PROCESSOR" ? "X" : " "}  DATA PROCESSOR     C. ${request.sourceOfError === "OTHER" ? "X" : " "}  OTHER  ${request.sourceOfError === "OTHER" ? sourceText.replace("Other:", "") : ""}`,
    font: regular,
    size: 9,
    borderWidth: 1.2,
  });
  y -= 34;

  page.drawText("Reason for Flight Record Correction", {
    x: MARGIN + 3,
    y: y - 14,
    size: 14,
    font: bold,
  });
  y -= 23;
  page.drawText(
    '***NOTE: All asterisk items (*) need to be entered in the "Now Reads" column***',
    { x: MARGIN + 16, y: y - 8, size: 7.5, font: bold },
  );
  y -= 15;

  const widths = [170, 105, 105, contentWidth - 380];
  const headers = ["INCORRECT ITEM", "NOW READS", "SHOULD READ", "REMARKS"];
  let x = MARGIN;
  headers.forEach((header, index) => {
    drawCell(page, {
      x,
      y,
      width: widths[index],
      height: 21,
      text: header,
      font: bold,
      size: 9,
      align: "center",
      fill: LIGHT,
      borderWidth: 1.2,
    });
    x += widths[index];
  });
  y -= 21;

  const items = [...request.items].sort((a, b) => a.sortOrder - b.sortOrder);
  const rowHeight = Math.max(
    25,
    Math.min(38, Math.floor((y - 155) / Math.max(items.length, 1))),
  );

  for (const item of items) {
    x = MARGIN;
    const values = [
      `${item.customItemLabel || item.incorrectItem}${NOW_READS_REQUIRED_ITEMS.has(item.incorrectItem) ? " *" : ""}`,
      item.nowReads || "",
      item.shouldRead,
      item.remarks || "",
    ];
    values.forEach((value, index) => {
      drawCell(page, {
        x,
        y,
        width: widths[index],
        height: rowHeight,
        text: value,
        font: index === 0 ? bold : regular,
        size: 8,
        align: index === 0 || index === 3 ? "left" : "center",
      });
      x += widths[index];
    });
    y -= rowHeight;
  }

  y -= 8;
  const legacyNote =
    'If changing the lesson number or tasks, print a lesson checklist and include the appropriate lesson-status remarks and reason codes.';
  page.drawText(legacyNote, {
    x: MARGIN,
    y: y - 7,
    size: 6.8,
    font: regular,
    maxWidth: contentWidth,
  });
  y -= 20;
  const attachmentCount = request.attachments.length;
  page.drawText(
    attachmentCount > 0
      ? `Supporting documentation photo(s) uploaded: ${attachmentCount}`
      : "Supporting documentation photo(s) uploaded: none",
    {
      x: MARGIN,
      y: y - 7,
      size: 7.2,
      font: bold,
      color: BLACK,
    },
  );
  y -= 15;
  page.drawText("THIS FORM MUST BE SIGNED AND DATED BY THE INSTRUCTOR.", {
    x: MARGIN + 3,
    y: y - 13,
    size: 11,
    font: bold,
  });
  y -= 22;

  const signatureColumns = [180, 260, contentWidth - 440];
  const cfiSignature = request.signatures.find(
    (signature) => signature.signerRole === "CFI",
  );
  const leadSignature = request.signatures.find(
    (signature) => signature.signerRole === "LEAD_INSTRUCTOR",
  );
  const assistantChiefSignature = request.signatures.find(
    (signature) => signature.signerRole === "ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR",
  );
  const authorizationSignature = request.signatures.find(
    (signature) =>
      signature.signerRole !== "CFI" &&
      signature.signerRole !== "LEAD_INSTRUCTOR" &&
      signature.signerRole !== "ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR",
  );

  x = MARGIN;
  ["Instructor Identifier:", "Instructor Signature:", "Date:"].forEach(
    (label, index) => {
      drawCell(page, {
        x,
        y,
        width: signatureColumns[index],
        height: 14,
        text: label,
        font: regular,
        size: 7,
        borderWidth: 1.2,
      });
      x += signatureColumns[index];
    },
  );
  y -= 14;
  const signatureRowY = y;
  const cfiDate = cfiSignature?.signedAt.toLocaleDateString("en-US") ?? "";
  x = MARGIN;
  [request.instructorIdentifier, "", cfiDate].forEach((value, index) => {
    drawCell(page, {
      x,
      y,
      width: signatureColumns[index],
      height: 34,
      text: value,
      font: bold,
      size: 9,
      align: "center",
      borderWidth: 1.2,
    });
    x += signatureColumns[index];
  });
  await drawSignatureImage(
    pdf,
    page,
    cfiSignature?.signatureImageUrl,
    {
      x: MARGIN + signatureColumns[0],
      y: signatureRowY,
      width: signatureColumns[1],
      height: 34,
    },
  );
  y -= 34;

  for (const approvalLine of [
    {
      label: "Lead Instructor Signature:",
      signature: leadSignature,
      dateLabel: "Lead Signed Date:",
    },
    {
      label: "Assistant Chief Signature:",
      signature: assistantChiefSignature,
      dateLabel: "Assistant Chief Signed Date:",
    },
  ]) {
    x = MARGIN;
    [approvalLine.label, "Signer:", approvalLine.dateLabel].forEach(
      (label, index) => {
        drawCell(page, {
          x,
          y,
          width: signatureColumns[index],
          height: 14,
          text: label,
          font: regular,
          size: 7,
          borderWidth: 1.2,
        });
        x += signatureColumns[index];
      },
    );
    y -= 14;
    const approvalRowY = y;
    x = MARGIN;
    [
      "",
      approvalLine.signature?.signerName ?? "",
      approvalLine.signature?.signedAt.toLocaleDateString("en-US") ?? "",
    ].forEach((value, index) => {
      drawCell(page, {
        x,
        y,
        width: signatureColumns[index],
        height: 28,
        text: value,
        font: bold,
        size: 8,
        align: "center",
        borderWidth: 1.2,
      });
      x += signatureColumns[index];
    });
    await drawSignatureImage(pdf, page, approvalLine.signature?.signatureImageUrl, {
      x: MARGIN,
      y: approvalRowY,
      width: signatureColumns[0],
      height: 28,
    });
    y -= 28;
  }

  x = MARGIN;
  ["Authorization Signature:", "Correction performed by:", "Date:"].forEach(
    (label, index) => {
      drawCell(page, {
        x,
        y,
        width: signatureColumns[index],
        height: 14,
        text: label,
        font: regular,
        size: 7,
        borderWidth: 1.2,
      });
      x += signatureColumns[index];
    },
  );
  y -= 14;
  const authRowY = y;
  const completionDate =
    request.recordsAction?.completedAt?.toLocaleDateString("en-US") ?? "";
  x = MARGIN;
  [
    "",
    request.recordsAction?.correctionPerformedByName ?? "",
    completionDate,
  ].forEach((value, index) => {
    drawCell(page, {
      x,
      y,
      width: signatureColumns[index],
      height: 34,
      text: value,
      font: bold,
      size: 8,
      align: "center",
      borderWidth: 1.2,
    });
    x += signatureColumns[index];
  });
  await drawSignatureImage(
    pdf,
    page,
    authorizationSignature?.signatureImageUrl,
    {
      x: MARGIN,
      y: authRowY,
      width: signatureColumns[0],
      height: 34,
    },
  );

  page.drawText(`${request.requestNumber} · Generated ${new Date().toLocaleString()}`, {
    x: MARGIN,
    y: 12,
    size: 6.5,
    font: regular,
    color: rgb(0.35, 0.35, 0.35),
  });

  return pdf.save();
}
