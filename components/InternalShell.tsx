import Link from "next/link";
import {
  Archive,
  ClipboardCheck,
  FilePenLine,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { logoutAction } from "@/app/login/actions";
import { ROLE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/lib/permissions";

export function InternalShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const nav = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: "/approvals",
      label: "Approvals",
      icon: ClipboardCheck,
      show:
        user.role === UserRole.LEAD_INSTRUCTOR ||
        user.role === UserRole.ASSISTANT_CHIEF_FLIGHT_INSTRUCTOR ||
        user.role === UserRole.ADMIN,
    },
    {
      href: "/records",
      label: "Records",
      icon: Archive,
      show: user.role === UserRole.RECORDS || user.role === UserRole.ADMIN,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Settings,
      show: user.role === UserRole.ADMIN,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-navy text-white lg:min-h-screen">
        <div className="flex items-center justify-between border-b border-white/20 px-5 py-5 lg:block">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-white text-navy">
              <FilePenLine aria-hidden="true" size={21} />
            </div>
            <div>
              <p className="font-extrabold tracking-wide">FLIGHT SCHOOL</p>
              <p className="text-xs font-semibold tracking-[0.14em] text-blue-200">
                RECORDS
              </p>
            </div>
          </Link>
          <p className="mt-5 hidden text-xs leading-5 text-blue-100 lg:block">
            Signed in as
            <span className="block font-bold text-white">{user.name}</span>
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <nav className="flex overflow-x-auto px-3 py-3 lg:block lg:space-y-1 lg:px-4 lg:py-5">
          {nav
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-w-fit items-center gap-3 px-3 py-2.5 text-sm font-semibold text-blue-50 hover:bg-white/10"
                >
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </Link>
              );
            })}
          <form action={logoutAction} className="lg:mt-6">
            <button
              className="flex min-w-fit items-center gap-3 px-3 py-2.5 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white"
              type="submit"
            >
              <LogOut aria-hidden="true" size={18} />
              Sign out
            </button>
          </form>
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
          <p className="text-sm font-semibold text-slate-600 lg:hidden">
            {user.name} · {ROLE_LABELS[user.role]}
          </p>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
