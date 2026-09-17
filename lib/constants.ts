import { CorrectionStatus, SourceOfError, UserRole } from "@prisma/client";

export const DEFAULT_CORRECTION_ITEMS = [
  "Course number",
  "Lesson number",
  "Lesson status",
  "Activity date",
  "Approach across",
  "Approach drop-down",
  "Dual / Dual CPL",
  "Dual X-C hours",
  "Dual night hours",
  "Instrument hours IR / CPL",
  "Night landings",
  "PDPIC",
  "PIC tower landings at night",
  "Night hours",
  "Solo night hours",
  "Solo tower landings",
  "Solo tower landings at night",
  "Solo X-C hours",
  "Total landings",
  "Approach",
  "Route",
  "Group brief",
  "Other",
  "CAAC Dual Airplane",
] as const;

export const NOW_READS_REQUIRED_ITEMS = new Set<string>([
  "Course number",
  "Lesson number",
  "Lesson status",
  "Activity date",
]);

export const ROLE_LABELS: Record<UserRole, string> = {
  LEAD_INSTRUCTOR: "Lead Instructor",
  ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR:
    "Assistant Chief Flight Instructor",
  RECORDS: "Records",
  ADMIN: "Admin",
};

export const STATUS_LABELS: Record<CorrectionStatus, string> = {
  SUBMITTED: "Submitted",
  PENDING_APPROVAL: "Pending Approval",
  PENDING_LEAD_INSTRUCTOR_APPROVAL: "Pending Lead Instructor Approval",
  PENDING_ASSISTANT_CHIEF_APPROVAL: "Pending Assistant Chief Approval",
  PENDING_MULTIPLE_APPROVALS: "Pending Multiple Approvals",
  APPROVED_PENDING_RECORDS: "Approved - Pending Records",
  SENT_TO_RECORDS: "Sent to Records",
  PRINTED_BY_RECORDS: "Printed by Records",
  ENTERED_INTO_STUDENT_FILE: "Entered into Student File",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export const SOURCE_LABELS: Record<SourceOfError, string> = {
  STUDENT_INSTRUCTOR: "Student / Instructor",
  DATA_PROCESSOR: "Data Processor",
  OTHER: "Other",
};
