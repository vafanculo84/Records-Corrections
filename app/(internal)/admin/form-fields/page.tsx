import { UserRole } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { manageFormFieldAction } from "./actions";

export default async function FormFieldsPage() {
  await requireSession([UserRole.ADMIN]);
  const fields = await db.formFieldConfig.findMany({
    where: { fieldType: "correction_item" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold text-navy">Form fields</h1>
      <p className="mt-2 text-slate-600">
        Manage public correction item options and their requirements.
      </p>
      <section className="mt-7 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Add correction item</h2>
        <form action={manageFormFieldAction} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <input type="hidden" name="action" value="CREATE" />
          <label className="flex-1"><span className="form-label">Item label</span><input className="form-control mt-2" name="fieldLabel" required /></label>
          <label className="pb-3 text-sm font-semibold text-navy"><input type="checkbox" name="requiresNowReads" className="mr-2" />Requires “Now Reads”</label>
          <button className="primary-button" type="submit">Add item</button>
        </form>
      </section>
      <section className="mt-7 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Correction items</h2>
        <div className="mt-4 space-y-2">
          {fields.map((field) => (
            <form
              action={manageFormFieldAction}
              key={field.id}
              className="grid gap-3 border border-slate-200 p-3 md:grid-cols-[1fr_100px_150px_150px_120px]"
            >
              <input type="hidden" name="action" value="UPDATE" />
              <input type="hidden" name="id" value={field.id} />
              <p className="self-center font-semibold">{field.fieldLabel}</p>
              <label><span className="form-label">Order</span><input className="form-control mt-1" name="sortOrder" type="number" defaultValue={field.sortOrder} /></label>
              <label className="self-center text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={field.active} className="mr-2" />Active</label>
              <label className="self-center text-sm font-semibold"><input type="checkbox" name="requiresNowReads" defaultChecked={field.requiresNowReads} className="mr-2" />Now Reads</label>
              <button className="secondary-button" type="submit">Save</button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
