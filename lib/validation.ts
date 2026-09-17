import { z } from "zod";
import { NOW_READS_REQUIRED_ITEMS } from "@/lib/constants";

export const correctionItemSchema = z.object({
  incorrectItem: z.string().trim().min(1, "Select an incorrect item."),
  customItemLabel: z.string().trim().max(120).optional().default(""),
  nowReads: z.string().trim().max(500).optional().default(""),
  shouldRead: z.string().trim().min(1, "Should read is required.").max(500),
  remarks: z.string().trim().max(1000).optional().default(""),
});

export const publicCorrectionSchema = z
  .object({
    studentName: z.string().trim().min(1, "Student name is required.").max(150),
    studentId: z.string().trim().min(1, "Student ID is required.").max(80),
    transactionInError: z
      .string()
      .trim()
      .min(1, "Transaction in error is required.")
      .max(250),
    aircraftRegistration: z
      .string()
      .trim()
      .min(1, "Aircraft registration is required.")
      .max(40),
    sourceOfError: z.enum([
      "STUDENT_INSTRUCTOR",
      "DATA_PROCESSOR",
      "OTHER",
    ]),
    sourceOtherText: z.string().trim().max(500).optional().default(""),
    submittedByName: z
      .string()
      .trim()
      .min(1, "Instructor name is required.")
      .max(150),
    submittedByEmail: z
      .union([z.literal(""), z.email("Enter a valid email address.")])
      .optional()
      .default(""),
    instructorIdentifier: z
      .string()
      .trim()
      .min(1, "Instructor identifier is required.")
      .max(80),
    dateSigned: z.iso.date("Date signed is required."),
    signatureDataUrl: z
      .string()
      .regex(
        /^data:image\/png;base64,[A-Za-z0-9+/=]+$/,
        "Instructor signature is required.",
      ),
    correctionItems: z
      .array(correctionItemSchema)
      .min(1, "Add at least one correction item.")
      .max(25),
    website: z.string().max(0, "Automated submission rejected.").optional(),
    turnstileToken: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.sourceOfError === "OTHER" && !value.sourceOtherText) {
      context.addIssue({
        code: "custom",
        path: ["sourceOtherText"],
        message: "Explain the other source of error.",
      });
    }

    value.correctionItems.forEach((item, index) => {
      if (NOW_READS_REQUIRED_ITEMS.has(item.incorrectItem) && !item.nowReads) {
        context.addIssue({
          code: "custom",
          path: ["correctionItems", index, "nowReads"],
          message: "Now reads is required for this item.",
        });
      }

      if (
        item.incorrectItem === "Other" &&
        (!item.customItemLabel || !item.remarks)
      ) {
        if (!item.customItemLabel) {
          context.addIssue({
            code: "custom",
            path: ["correctionItems", index, "customItemLabel"],
            message: "Enter the custom item label.",
          });
        }

        if (!item.remarks) {
          context.addIssue({
            code: "custom",
            path: ["correctionItems", index, "remarks"],
            message: "Remarks are required for Other.",
          });
        }
      }
    });
  });

export type PublicCorrectionInput = z.infer<typeof publicCorrectionSchema>;
export type PublicCorrectionFormValues = z.input<
  typeof publicCorrectionSchema
>;

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const approvalActionSchema = z.object({
  requestId: z.string().cuid(),
  action: z.enum(["APPROVE", "REJECT"]),
  comments: z.string().trim().max(4000).optional().default(""),
  signatureDataUrl: z
    .union([
      z.literal(""),
      z.string().regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/),
    ])
    .optional()
    .default(""),
});
