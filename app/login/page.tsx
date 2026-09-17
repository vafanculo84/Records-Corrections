import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md border-t-4 border-navy bg-white p-7 shadow-lg sm:p-10">
        <div className="flex items-center gap-3 text-navy">
          <div className="flex h-11 w-11 items-center justify-center bg-navy text-white">
            <FilePenLine aria-hidden="true" size={23} />
          </div>
          <div>
            <p className="font-extrabold tracking-wide">FLIGHT SCHOOL</p>
            <p className="text-xs font-semibold tracking-[0.14em] text-slate-500">
              RECORDS
            </p>
          </div>
        </div>
        <h1 className="mt-8 text-3xl font-extrabold text-navy">
          Internal sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          For Lead Instructors, Assistant Chiefs, Records, and Admin users.
        </p>
        <LoginForm />
        <Link
          href="/records-correction"
          className="mt-6 block text-center text-sm font-semibold text-navy underline-offset-4 hover:underline"
        >
          Return to public correction form
        </Link>
      </section>
    </main>
  );
}
