import type { Prisma } from "@prisma/client";

export async function nextRequestNumber(tx: Prisma.TransactionClient) {
  const counter = await tx.requestCounter.upsert({
    where: { key: "records-correction" },
    create: { key: "records-correction", value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });

  return `RC-${String(counter.value).padStart(6, "0")}`;
}
