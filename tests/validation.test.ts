import { describe, expect, it } from "vitest";
import { publicCorrectionSchema } from "@/lib/validation";

const validRequest = {
  studentName: "Alex Pilot",
  studentId: "S12345",
  transactionInError: "Flight record 9001",
  aircraftRegistration: "N123AB",
  sourceOfError: "STUDENT_INSTRUCTOR",
  sourceOtherText: "",
  submittedByName: "Casey Instructor",
  submittedByEmail: "",
  instructorIdentifier: "CFI42",
  dateSigned: "2026-06-21",
  signatureDataUrl: `data:image/png;base64,${Buffer.from("signature").toString("base64")}`,
  website: "",
  correctionItems: [
    {
      incorrectItem: "Course number",
      customItemLabel: "",
      nowReads: "101",
      shouldRead: "102",
      remarks: "",
    },
  ],
};

describe("public correction validation", () => {
  it("accepts a complete signed request", () => {
    expect(publicCorrectionSchema.safeParse(validRequest).success).toBe(true);
  });

  it("requires now reads for asterisk items", () => {
    const result = publicCorrectionSchema.safeParse({
      ...validRequest,
      correctionItems: [{ ...validRequest.correctionItems[0], nowReads: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("requires source explanation when source is Other", () => {
    const result = publicCorrectionSchema.safeParse({
      ...validRequest,
      sourceOfError: "OTHER",
      sourceOtherText: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires a custom label and remarks for Other item", () => {
    const result = publicCorrectionSchema.safeParse({
      ...validRequest,
      correctionItems: [
        {
          incorrectItem: "Other",
          customItemLabel: "",
          nowReads: "",
          shouldRead: "Correct value",
          remarks: "",
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
