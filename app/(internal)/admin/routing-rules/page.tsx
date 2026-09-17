import { UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { DEFAULT_CORRECTION_ITEMS, ROLE_LABELS, SOURCE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { manageRoutingRuleAction } from "./actions";

export default async function RoutingRulesPage() {
  await requireSession([UserRole.ADMIN]);
  const [rules, users] = await Promise.all([
    db.routingRule.findMany({ include: { requiredSpecificUser: true }, orderBy: { sortOrder: "asc" } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold text-navy">Routing rules</h1>
      <p className="mt-2 text-slate-600">Lower sort order runs first. Specific item rules beat the default fallback.</p>
      <section className="mt-7 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Add rule</h2>
        <form action={manageRoutingRuleAction} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input type="hidden" name="action" value="CREATE" />
          <label><span className="form-label">Rule name</span><input className="form-control mt-2" name="name" required /></label>
          <label><span className="form-label">Correction item</span><select className="form-control mt-2" name="correctionItem"><option value="">Any / fallback</option>{DEFAULT_CORRECTION_ITEMS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="form-label">Source of error</span><select className="form-control mt-2" name="sourceOfError"><option value="">Any</option>{Object.entries(SOURCE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label><span className="form-label">Instructor identifier</span><input className="form-control mt-2" name="instructorIdentifier" /></label>
          <label><span className="form-label">Required role</span><select className="form-control mt-2" name="requiredRole"><option value="">No role approval</option>{Object.entries(ROLE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label><span className="form-label">Specific user</span><select className="form-control mt-2" name="requiredSpecificUserId"><option value="">Entire role</option>{users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select></label>
          <label><span className="form-label">Sort order</span><input className="form-control mt-2" name="sortOrder" type="number" defaultValue={100} /></label>
          <div className="space-y-2 pt-6 text-sm font-semibold text-navy">
            <label className="block"><input type="checkbox" name="signatureRequired" className="mr-2" />Require signature</label>
            <label className="block"><input type="checkbox" name="commentsRequired" className="mr-2" />Require comments</label>
            <label className="block"><input type="checkbox" name="sendDirectlyToRecords" className="mr-2" />Send directly to Records</label>
          </div>
          <button className="primary-button" type="submit">Create rule</button>
        </form>
      </section>
      <section className="mt-7 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Configured rules</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-100"><tr><th className="p-3">Order</th><th className="p-3">Name</th><th className="p-3">Item / source</th><th className="p-3">Destination</th><th className="p-3">Requirements</th><th className="p-3">Status</th></tr></thead>
            <tbody>{rules.map((rule) => <tr className="border-b border-slate-200" key={rule.id}><td className="p-3">{rule.sortOrder}</td><td className="p-3 font-semibold">{rule.name}</td><td className="p-3">{rule.correctionItem || "Any"}{rule.sourceOfError ? ` · ${SOURCE_LABELS[rule.sourceOfError]}` : ""}</td><td className="p-3">{rule.sendDirectlyToRecords ? "Direct to Records" : rule.requiredSpecificUser?.name || (rule.requiredRole ? ROLE_LABELS[rule.requiredRole] : "None")}</td><td className="p-3">{[rule.signatureRequired && "Signature", rule.commentsRequired && "Comments"].filter(Boolean).join(", ") || "Standard"}</td><td className="p-3"><form action={manageRoutingRuleAction}><input type="hidden" name="action" value="TOGGLE" /><input type="hidden" name="id" value={rule.id} /><button className="text-button">{rule.active ? "Active" : "Inactive"}</button></form></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
