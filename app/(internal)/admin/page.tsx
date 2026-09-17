import Link from "next/link";
import { ListChecks, Mail, Route, Users } from "lucide-react";
import { UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";

const links = [
  {
    href: "/admin/users",
    title: "Internal users",
    description: "Create, assign roles, and deactivate internal accounts.",
    icon: Users,
  },
  {
    href: "/admin/routing-rules",
    title: "Routing rules",
    description: "Change approval paths without editing code.",
    icon: Route,
  },
  {
    href: "/admin/form-fields",
    title: "Form fields",
    description: "Manage correction items and field requirements.",
    icon: ListChecks,
  },
  {
    href: "/admin/email-settings",
    title: "Email settings",
    description: "Set the Records recipient and notification behavior.",
    icon: Mail,
  },
];

export default async function AdminPage() {
  await requireSession([UserRole.ADMIN]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold text-navy">Admin</h1>
      <p className="mt-2 text-slate-600">
        Manage internal access and workflow configuration.
      </p>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group border-l-4 border-navy bg-white p-6 shadow-sm hover:border-safety-orange"
            >
              <Icon className="text-navy" aria-hidden="true" size={24} />
              <h2 className="mt-4 text-lg font-extrabold text-navy group-hover:underline">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
