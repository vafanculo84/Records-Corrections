import { describe, expect, it } from "vitest";
import {
  CorrectionStatus,
  SourceOfError,
  UserRole,
} from "@prisma/client";
import {
  generateCorrectionPdf,
  type PdfCorrectionRequest,
} from "@/lib/pdf";

describe("PDF generation", () => {
  it("creates a printable PDF containing a submitted correction", async () => {
    const now = new Date("2026-06-21T18:00:00.000Z");
    const request = {
      id: "request-1",
      requestNumber: "RC-000123",
      studentName: "Alex Pilot",
      studentId: "S12345",
      transactionInError: "Flight record 9001",
      aircraftRegistration: "N123AB",
      sourceOfError: SourceOfError.STUDENT_INSTRUCTOR,
      sourceOtherText: null,
      submittedByName: "Casey Instructor",
      submittedByEmail: null,
      instructorIdentifier: "CFI42",
      submittedPublicly: true,
      status: CorrectionStatus.APPROVED_PENDING_RECORDS,
      currentAssigneeUserId: null,
      currentAssigneeRole: UserRole.RECORDS,
      submittedAt: now,
      sentToRecordsAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: "item-1",
          correctionRequestId: "request-1",
          incorrectItem: "Course number",
          customItemLabel: null,
          nowReads: "101",
          shouldRead: "102",
          remarks: "Correct catalog course.",
          requiresAdditionalSignature: false,
          requiresDocumentation: false,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        },
      ],
      signatures: [],
      approvals: [],
      attachments: [],
      recordsAction: null,
    } as PdfCorrectionRequest;

    const bytes = await generateCorrectionPdf(request);
    expect(bytes.length).toBeGreaterThan(1000);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
  });
});
