import { UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { manageUserAction } from "./actions";

export default async function AdminUsersPage() {
  await requireSession([UserRole.ADMIN]);
  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });

  return (
    <main>
      <h1 className="text-3xl font-extrabold text-navy">Internal users</h1>
      <p className="mt-2 text-slate-600">CFIs are intentionally not accounts in the MVP.</p>

      <section className="mt-7 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Create user</h2>
        <form action={manageUserAction} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input type="hidden" name="action" value="CREATE" />
          <label>
            <span className="form-label">Name</span>
            <input className="form-control mt-2" name="name" required />
          </label>
          <label>
            <span className="form-label">Email</span>
            <input className="form-control mt-2" name="email" type="email" required />
          </label>
          <label>
            <span className="form-label">Initial password</span>
            <input className="form-control mt-2" name="password" type="password" minLength={10} required />
          </label>
          <label>
            <span className="form-label">Role</span>
            <select className="form-control mt-2" name="role">
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <button className="primary-button md:col-span-2 xl:col-span-1" type="submit">Create user</button>
        </form>
      </section>

      <section className="mt-7 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-100">
              <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="border-b border-slate-200" key={user.id}>
                  <td className="p-3 font-semibold">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{ROLE_LABELS[user.role]}</td>
                  <td className="p-3">{user.active ? "Active" : "Inactive"}</td>
                  <td className="p-3">
                    <form action={manageUserAction}>
                      <input type="hidden" name="action" value="TOGGLE" />
                      <input type="hidden" name="id" value={user.id} />
                      <button className="text-button" type="submit">
                        {user.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
