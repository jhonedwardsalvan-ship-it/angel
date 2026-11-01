import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { deleteColorAction, saveColorAction } from "@/lib/admin/actions/colors";
import { listColors } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";
import type { AdminColor } from "@/types/admin";

export const metadata = { title: "Colors" };

/** Swatch, name, what it's for and where it's offered. Shared by the new-color row and each existing row. */
function ColorFields({ color }: { color?: AdminColor }) {
  return (
    <>
      <input type="color" name="hex" defaultValue={color?.hex ?? "#e8a0bf"} aria-label="Swatch" className="h-10 w-12 cursor-pointer rounded-control border border-line bg-canvas p-1" />
      <input name="name" required maxLength={30} defaultValue={color?.name} placeholder="Name, e.g. Blush pink" aria-label="Name" className="input py-2 text-sm" />
      <fieldset className="flex items-center gap-3 text-sm">
        <legend className="sr-only">Use for</legend>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="forFlowers" defaultChecked={color ? color.forFlowers : true} className="size-4 accent-primary" />
          Flowers
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="forWrappers" defaultChecked={color?.forWrappers ?? false} className="size-4 accent-primary" />
          Wrapper
        </label>
      </fieldset>
      <select name="appliesTo" defaultValue={color?.appliesTo ?? "selected"} aria-label="Offered on" className="input py-2 text-sm">
        <option value="all">All products</option>
        <option value="selected">Only products I tick</option>
      </select>
    </>
  );
}

function ColorRow({ color }: { color: AdminColor }) {
  return (
    <li className={`panel stack gap-2 ${color.isActive ? "" : "opacity-70"}`}>
      <form action={saveColorAction} className="grid gap-2 sm:grid-cols-[3rem_1fr_auto_11rem_auto_auto] sm:items-center">
        <input type="hidden" name="id" value={color.id} />
        <ColorFields color={color} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={color.isActive} className="size-4 accent-primary" />
          Active
        </label>
        <button type="submit" className="btn btn-outline btn-sm">Save</button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>
          {[color.forFlowers && "Flowers", color.forWrappers && "Wrapper"].filter(Boolean).join(" & ")} ·{" "}
          {!color.isActive ? "Hidden from buyers." : color.appliesTo === "all" ? "Offered on every product." : `Ticked on ${color.productCount} ${color.productCount === 1 ? "product" : "products"}.`}
        </span>
        <form action={deleteColorAction}>
          <input type="hidden" name="id" value={color.id} />
          <button type="submit" className="link text-danger">Delete</button>
        </form>
      </div>
    </li>
  );
}

export default async function AdminColorsPage({ searchParams }: PageProps<"/admin/colors">) {
  await requireAdmin("/admin/colors");
  const [params, colors] = await Promise.all([searchParams, listColors()]);
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Colors"
        description="Add each color once and tick what it's for: Flowers, Wrapper or both. Buyers choose 1 or 2 of each. Offer a color on all products, or tick it on specific products in the product form."
      />
      <Flash notice={params.notice} error={params.error} />

      <section aria-labelledby="new-color" className="panel stack mb-8 gap-3">
        <h2 id="new-color" className="text-h4">New color</h2>
        <form action={saveColorAction} className="grid gap-2 sm:grid-cols-[3rem_1fr_auto_11rem_auto] sm:items-center">
          <ColorFields />
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
        </form>
      </section>

      {colors.length === 0 ? (
        <p className="panel text-sm text-ink-muted">No colors yet. Add one above, e.g. “Blush pink” for Flowers and Wrapper.</p>
      ) : (
        <ul className="stack gap-3">{colors.map((c) => <ColorRow key={c.id} color={c} />)}</ul>
      )}
    </div>
  );
}
