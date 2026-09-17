import { InternalShell } from "@/components/InternalShell";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  return <InternalShell user={user}>{children}</InternalShell>;
}
