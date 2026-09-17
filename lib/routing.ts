import {
  CorrectionStatus,
  SourceOfError,
  UserRole,
} from "@prisma/client";

export type RoutingRuleInput = {
  id: string;
  correctionItem: string | null;
  sourceOfError: SourceOfError | null;
  instructorIdentifier: string | null;
  requiredRole: UserRole | null;
  requiredSpecificUserId: string | null;
  signatureRequired: boolean;
  commentsRequired: boolean;
  sendDirectlyToRecords: boolean;
  sortOrder: number;
};

export type RoutingRequestInput = {
  correctionItems: string[];
  sourceOfError: SourceOfError;
  instructorIdentifier: string;
};

export type ApprovalRoute = {
  ruleId: string;
  role: UserRole;
  userId: string | null;
  signatureRequired: boolean;
  commentsRequired: boolean;
};

export type RoutingDecision = {
  approvals: ApprovalRoute[];
  status: CorrectionStatus;
  directToRecords: boolean;
  currentAssigneeRole: UserRole | null;
  currentAssigneeUserId: string | null;
  matchedRuleIds: string[];
};

function ruleMatchesContext(
  rule: RoutingRuleInput,
  request: RoutingRequestInput,
) {
  if (rule.sourceOfError && rule.sourceOfError !== request.sourceOfError) {
    return false;
  }

  if (
    rule.instructorIdentifier &&
    rule.instructorIdentifier.toLowerCase() !==
      request.instructorIdentifier.toLowerCase()
  ) {
    return false;
  }

  return true;
}

function decisionStatus(approvals: ApprovalRoute[]) {
  const roles = new Set(approvals.map((approval) => approval.role));
  if (approvals.length > 1 || roles.size > 1) {
    return CorrectionStatus.PENDING_MULTIPLE_APPROVALS;
  }
  if (roles.has(UserRole.LEAD_INSTRUCTOR)) {
    return CorrectionStatus.PENDING_LEAD_INSTRUCTOR_APPROVAL;
  }
  if (roles.has(UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR)) {
    return CorrectionStatus.PENDING_ASSISTANT_CHIEF_APPROVAL;
  }
  return CorrectionStatus.PENDING_APPROVAL;
}

function roleRequiresApprovalSignature(role: UserRole) {
  return (
    role === UserRole.LEAD_INSTRUCTOR ||
    role === UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR
  );
}

export function buildRoutingDecision(
  request: RoutingRequestInput,
  rules: RoutingRuleInput[],
): RoutingDecision {
  const orderedRules = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);
  const contextualRules = orderedRules.filter((rule) =>
    ruleMatchesContext(rule, request),
  );
  const matched = new Map<string, RoutingRuleInput>();

  for (const item of request.correctionItems) {
    const itemRules = contextualRules.filter(
      (rule) => rule.correctionItem === item,
    );
    const fallbackRules = contextualRules.filter(
      (rule) =>
        !rule.correctionItem &&
        !rule.sourceOfError &&
        !rule.instructorIdentifier,
    );

    for (const rule of itemRules.length > 0 ? itemRules : fallbackRules) {
      matched.set(rule.id, rule);
    }
  }

  for (const rule of contextualRules) {
    if (
      !rule.correctionItem &&
      (rule.sourceOfError || rule.instructorIdentifier)
    ) {
      matched.set(rule.id, rule);
    }
  }

  const approvalMap = new Map<string, ApprovalRoute>();
  let directToRecords = matched.size > 0;

  for (const rule of matched.values()) {
    if (!rule.sendDirectlyToRecords) {
      directToRecords = false;
    }

    if (!rule.requiredRole) continue;

    const key = `${rule.requiredRole}:${rule.requiredSpecificUserId ?? "role"}`;
    const current = approvalMap.get(key);
    approvalMap.set(key, {
      ruleId: current?.ruleId ?? rule.id,
      role: rule.requiredRole,
      userId: rule.requiredSpecificUserId,
      signatureRequired:
        Boolean(current?.signatureRequired) ||
        rule.signatureRequired ||
        roleRequiresApprovalSignature(rule.requiredRole),
      commentsRequired:
        Boolean(current?.commentsRequired) || rule.commentsRequired,
    });
  }

  const approvals = [...approvalMap.values()];
  if (approvals.length > 0) directToRecords = false;

  if (directToRecords || approvals.length === 0) {
    return {
      approvals: [],
      status: CorrectionStatus.SENT_TO_RECORDS,
      directToRecords: true,
      currentAssigneeRole: UserRole.RECORDS,
      currentAssigneeUserId: null,
      matchedRuleIds: [...matched.keys()],
    };
  }

  return {
    approvals,
    status: decisionStatus(approvals),
    directToRecords: false,
    currentAssigneeRole:
      approvals.length === 1 ? approvals[0].role : null,
    currentAssigneeUserId:
      approvals.length === 1 ? approvals[0].userId : null,
    matchedRuleIds: [...matched.keys()],
  };
}
