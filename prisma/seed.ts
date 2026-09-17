import { hash } from "bcryptjs";
import {
  PrismaClient,
  SourceOfError,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const correctionItems = [
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

const nowReadsRequired = new Set([
  "Course number",
  "Lesson number",
  "Lesson status",
  "Activity date",
]);

async function main() {
  const passwordHash = await hash("ChangeMe123!", 12);

  const users = [
    {
      name: "System Admin",
      email: "admin@example.com",
      role: UserRole.ADMIN,
    },
    {
      name: "Lead Instructor",
      email: "lead@example.com",
      role: UserRole.LEAD_INSTRUCTOR,
    },
    {
      name: "Assistant Chief",
      email: "assistant-chief@example.com",
      role: UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
    },
    {
      name: "Records Specialist",
      email: "records@example.com",
      role: UserRole.RECORDS,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, passwordHash, active: true },
      create: { ...user, passwordHash, active: true },
    });
  }

  for (const [index, item] of correctionItems.entries()) {
    await prisma.formFieldConfig.upsert({
      where: { fieldKey: `correction_item:${item}` },
      update: {
        fieldLabel: item,
        active: true,
        requiresNowReads: nowReadsRequired.has(item),
        sortOrder: index,
      },
      create: {
        fieldKey: `correction_item:${item}`,
        fieldLabel: item,
        fieldType: "correction_item",
        required: false,
        active: true,
        requiresNowReads: nowReadsRequired.has(item),
        sortOrder: index,
      },
    });
  }

  await prisma.routingRule.deleteMany({
    where: { name: { startsWith: "Default:" } },
  });

  await prisma.routingRule.createMany({
    data: [
      {
        name: "Default: Data Processor source",
        sourceOfError: SourceOfError.DATA_PROCESSOR,
        requiredRole: UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
        sortOrder: 10,
      },
      {
        name: "Default: Course number",
        correctionItem: "Course number",
        requiredRole: UserRole.LEAD_INSTRUCTOR,
        sortOrder: 20,
      },
      {
        name: "Default: Lesson number",
        correctionItem: "Lesson number",
        requiredRole: UserRole.LEAD_INSTRUCTOR,
        sortOrder: 21,
      },
      {
        name: "Default: Lesson status",
        correctionItem: "Lesson status",
        requiredRole: UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
        sortOrder: 22,
      },
      {
        name: "Default: Activity date",
        correctionItem: "Activity date",
        requiredRole: UserRole.LEAD_INSTRUCTOR,
        sortOrder: 23,
      },
      {
        name: "Default: Other",
        correctionItem: "Other",
        requiredRole: UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR,
        commentsRequired: true,
        sortOrder: 24,
      },
      {
        name: "Default: All other items",
        requiredRole: UserRole.LEAD_INSTRUCTOR,
        sortOrder: 999,
      },
    ],
  });

  await prisma.emailSetting.upsert({
    where: { id: "default" },
    update: { recordsRecipientEmail: "records@example.com" },
    create: {
      id: "default",
      recordsRecipientEmail: "records@example.com",
    },
  });

  await prisma.requestCounter.upsert({
    where: { key: "records-correction" },
    update: {},
    create: { key: "records-correction", value: 0 },
  });

  console.info("Seed complete.");
  console.info("MVP login password for all seeded users: ChangeMe123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
