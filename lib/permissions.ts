import { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export function canViewAllRequests(role: UserRole) {
  return role === UserRole.RECORDS || role === UserRole.ADMIN;
}

export function canManageUsers(role: UserRole) {
  return role === UserRole.ADMIN;
}

export function canManageConfiguration(role: UserRole) {
  return role === UserRole.ADMIN;
}

export function canProcessRecords(role: UserRole) {
  return role === UserRole.RECORDS || role === UserRole.ADMIN;
}

export function canApprove(role: UserRole) {
  return (
    role === UserRole.LEAD_INSTRUCTOR ||
    role === UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR ||
    role === UserRole.ADMIN
  );
}

export function canAccessApproval(
  user: SessionUser,
  approval: { approverUserId: string | null; approverRole: UserRole },
) {
  if (user.role === UserRole.ADMIN) return true;
  if (approval.approverUserId) return approval.approverUserId === user.id;
  return approval.approverRole === user.role;
}
