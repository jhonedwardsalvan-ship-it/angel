import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { deleteAddOnAction, saveAddOnAction } from "@/lib/admin/actions/add-ons";
import { listAddOns } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";
import type { AdminAddOn } from "@/types/admin";

export const metadata = { title: "Add-ons" };

/** Name, price per piece and where it's offered. Shared by the new-add-on row and each existing row. */
function AddOnFields({ addOn }: { addOn?: AdminAddOn }) {
  return (
    <>
      <input name="name" required maxLength={40} defaultValue={addOn?.name} placeholder="Name, e.g. Glitter" aria-label="Name" className="input py-2 text-sm" />
      <input name="price" required inputMode="numeric" defaultValue={addOn?.price} placeholder="₱ each" aria-label="Price per piece (₱)" className="input py-2 text-sm" />
      <select name="appliesTo" defaultValue={addOn?.appliesTo ?? "selected"} aria-label="Offered on" className="input py-2 text-sm">
        <option value="all">All products</option>
        <option value="selected">Only products I tick</option>
      </select>
    </>
  );
}

export default async function AdminAddOnsPage({ searchParams }: PageProps<"/admin/add-ons">) {
  await requireAdmin("/admin/add-ons");
  const [params, addOns] = await Promise.all([searchParams, listAddOns()]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Add-ons"
        description="Extras buyers can add, priced per piece (they choose how many). Offer one on all products, or tick it on specific products in the product form."
      />
      <Flash notice={params.notice} error={params.error} />

      <section aria-labelledby="new-addon" className="panel stack mb-8 gap-3">
        <h2 id="new-addon" className="text-h4">New add-on</h2>
        <form action={saveAddOnAction} className="grid gap-2 sm:grid-cols-[1fr_7rem_12rem_auto] sm:items-center">
          <AddOnFields />
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
        </form>
      </section>

      {addOns.length === 0 ? (
        <p className="panel text-sm text-ink-muted">No add-ons yet. Create one above, e.g. “Glitter” at ₱10 each.</p>
      ) : (
        <ul className="stack gap-3">
          {addOns.map((a) => (
            <li key={a.id} className={`panel stack gap-2 ${a.isActive ? "" : "opacity-70"}`}>
              <form action={saveAddOnAction} className="grid gap-2 sm:grid-cols-[1fr_7rem_12rem_auto_auto] sm:items-center">
                <input type="hidden" name="id" value={a.id} />
                <AddOnFields addOn={a} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={a.isActive} className="size-4 accent-primary" />
                  Active
                </label>
                <button type="submit" className="btn btn-outline btn-sm">Save</button>
              </form>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                <span>
                  {!a.isActive ? "Hidden from buyers." : a.appliesTo === "all" ? "Offered on every product." : `Ticked on ${a.productCount} ${a.productCount === 1 ? "product" : "products"}.`}
                </span>
                <form action={deleteAddOnAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="link text-danger">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
