import type {
  CorrectionStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

type AuditClient = PrismaClient | Prisma.TransactionClient;

type AuditInput = {
  correctionRequestId?: string;
  userId?: string;
  publicActorName?: string;
  publicActorIdentifier?: string;
  action: string;
  previousStatus?: CorrectionStatus;
  newStatus?: CorrectionStatus;
  comments?: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function writeAuditLog(client: AuditClient, input: AuditInput) {
  return client.auditLog.create({
    data: {
      correctionRequestId: input.correctionRequestId,
      userId: input.userId,
      publicActorName: input.publicActorName,
      publicActorIdentifier: input.publicActorIdentifier,
      action: input.action,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      comments: input.comments,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
