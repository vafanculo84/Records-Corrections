import { describe, expect, it } from "vitest";
import {
  CorrectionStatus,
  SourceOfError,
  UserRole,
} from "@prisma/client";
import { buildRoutingDecision, type RoutingRuleInput } from "@/lib/routing";

function rule(
  partial: Partial<RoutingRuleInput> & Pick<RoutingRuleInput, "id">,
): RoutingRuleInput {
  return {
    correctionItem: null,
    sourceOfError: null,
    instructorIdentifier: null,
    requiredRole: UserRole.LEAD_INSTRUCTOR,
    requiredSpecificUserId: null,
    signatureRequired: false,
    commentsRequired: false,
    sendDirectlyToRecords: false,
    sortOrder: 100,
    ...partial,
  };
}

describe("routing engine", () => {
  it("uses a specific item rule instead of the generic fallback", () => {
    const decision = buildRoutingDecision(
      {
        correctionItems: ["Lesson status"],
        sourceOfError: SourceOfError.STUDENT_INSTRUCTOR,
        instructorIdentifier: "CFI1",
      },
      [
        rule({ id: "fallback", sortOrder: 999 }),
        rule({
          id: "lesson-status",
          correctionItem: "Lesson status",
          requiredRole: UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
        }),
      ],
    );

    expect(decision.approvals).toHaveLength(1);
    expect(decision.approvals[0].role).toBe(
      UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
    );
    expect(decision.status).toBe(
      CorrectionStatus.PENDING_ASSISTANT_CHIEF_APPROVAL,
    );
  });

  it("creates multiple approvals when different items require different roles", () => {
    const decision = buildRoutingDecision(
      {
        correctionItems: ["Course number", "Lesson status"],
        sourceOfError: SourceOfError.STUDENT_INSTRUCTOR,
        instructorIdentifier: "CFI1",
      },
      [
        rule({ id: "course", correctionItem: "Course number" }),
        rule({
          id: "status",
          correctionItem: "Lesson status",
          requiredRole: UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
        }),
      ],
    );

    expect(decision.approvals).toHaveLength(2);
    expect(decision.status).toBe(CorrectionStatus.PENDING_MULTIPLE_APPROVALS);
  });

  it("requires signatures for lead and assistant chief approvals by default", () => {
    const decision = buildRoutingDecision(
      {
        correctionItems: ["Course number", "Lesson status"],
        sourceOfError: SourceOfError.STUDENT_INSTRUCTOR,
        instructorIdentifier: "CFI1",
      },
      [
        rule({ id: "lead", correctionItem: "Course number" }),
        rule({
          id: "assistant-chief",
          correctionItem: "Lesson status",
          requiredRole: UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
        }),
      ],
    );

    expect(decision.approvals.every((approval) => approval.signatureRequired)).toBe(
      true,
    );
  });

  it("sends directly to Records when the matched rule requires no approval", () => {
    const decision = buildRoutingDecision(
      {
        correctionItems: ["Route"],
        sourceOfError: SourceOfError.STUDENT_INSTRUCTOR,
        instructorIdentifier: "CFI1",
      },
      [
        rule({
          id: "direct",
          correctionItem: "Route",
          requiredRole: null,
          sendDirectlyToRecords: true,
        }),
      ],
    );

    expect(decision.directToRecords).toBe(true);
    expect(decision.status).toBe(CorrectionStatus.SENT_TO_RECORDS);
  });
});
