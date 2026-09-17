import { UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateEmailSettingsAction } from "./actions";

export default async function EmailSettingsPage() {
  await requireSession([UserRole.ADMIN]);
  const settings = await db.emailSetting.upsert({
    where: { id: "default" },
    create: { id: "default", recordsRecipientEmail: "records@example.com" },
    update: {},
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold text-navy">Email settings</h1>
      <p className="mt-2 text-slate-600">
        SMTP credentials remain environment configuration; recipients are editable here.
      </p>
      <section className="mt-7 max-w-2xl bg-white p-5 shadow-sm">
        <form action={updateEmailSettingsAction} className="space-y-5">
          <label className="block">
            <span className="form-label">Records recipient email</span>
            <input
              className="form-control mt-2"
              name="recordsRecipientEmail"
              type="email"
              defaultValue={settings.recordsRecipientEmail}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-navy">
            <input type="checkbox" name="approvalNotifications" defaultChecked={settings.approvalNotifications} className="mr-2" />
            Send new-approval notifications
          </label>
          <label className="block text-sm font-semibold text-navy">
            <input type="checkbox" name="recordsNotifications" defaultChecked={settings.recordsNotifications} className="mr-2" />
            Send Records notifications
          </label>
          <div className="border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            Current local email mode: <strong>{process.env.EMAIL_MODE ?? "log"}</strong>.
            Use <code>EMAIL_MODE=smtp</code> with SMTP environment variables to send real messages.
          </div>
          <button className="primary-button" type="submit">Save email settings</button>
        </form>
      </section>
    </main>
  );
}
