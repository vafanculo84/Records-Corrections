import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import {
  canAccessApproval,
  canManageConfiguration,
  canProcessRecords,
} from "@/lib/permissions";

const lead = {
  id: "lead-1",
  name: "Lead",
  email: "lead@example.com",
  role: UserRole.LEAD_INSTRUCTOR,
};

describe("permissions", () => {
  it("allows a role-assigned approver", () => {
    expect(
      canAccessApproval(lead, {
        approverUserId: null,
        approverRole: UserRole.LEAD_INSTRUCTOR,
      }),
    ).toBe(true);
  });

  it("does not allow a different specific user", () => {
    expect(
      canAccessApproval(lead, {
        approverUserId: "someone-else",
        approverRole: UserRole.LEAD_INSTRUCTOR,
      }),
    ).toBe(false);
  });

  it("limits configuration to Admin and Records processing to Records/Admin", () => {
    expect(canManageConfiguration(UserRole.ADMIN)).toBe(true);
    expect(canManageConfiguration(UserRole.RECORDS)).toBe(false);
    expect(canProcessRecords(UserRole.RECORDS)).toBe(true);
    expect(canProcessRecords(UserRole.LEAD_INSTRUCTOR)).toBe(false);
  });
});
