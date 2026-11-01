import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { deleteColorAction, saveColorAction } from "@/lib/admin/actions/colors";
import { listColors } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";
import type { AdminColor } from "@/types/admin";

export const metadata = { title: "Colors" };

/** Swatch and name. Shared by the new-color row and each existing row. */
function ColorFields({ color }: { color?: AdminColor }) {
  return (
    <>
      <input type="color" name="hex" defaultValue={color?.hex ?? "#e8a0bf"} aria-label="Swatch" className="h-10 w-12 cursor-pointer rounded-control border border-line bg-canvas p-1" />
      <input name="name" required maxLength={30} defaultValue={color?.name} placeholder="Name, e.g. Blush pink" aria-label="Name" className="input py-2 text-sm" />
    </>
  );
}

function ColorRow({ color }: { color: AdminColor }) {
  return (
    <li className={`panel stack gap-2 ${color.isActive ? "" : "opacity-70"}`}>
      <form action={saveColorAction} className="grid gap-2 sm:grid-cols-[3rem_1fr_auto_auto] sm:items-center">
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
          {!color.isActive ? "Hidden from buyers." : `Used on ${color.productCount} ${color.productCount === 1 ? "product" : "products"}.`}
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
        description="Your color list. In each product, tick which of these buyers can pick for the flowers and which for the wrapper (1 or 2 of each)."
      />
      <Flash notice={params.notice} error={params.error} />

      <section aria-labelledby="new-color" className="panel stack mb-8 gap-3">
        <h2 id="new-color" className="text-h4">New color</h2>
        <form action={saveColorAction} className="grid gap-2 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
          <ColorFields />
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
        </form>
      </section>

      {colors.length === 0 ? (
        <p className="panel text-sm text-ink-muted">No colors yet. Add one above, e.g. “Blush pink”.</p>
      ) : (
        <ul className="stack gap-3">{colors.map((c) => <ColorRow key={c.id} color={c} />)}</ul>
      )}
    </div>
  );
}
