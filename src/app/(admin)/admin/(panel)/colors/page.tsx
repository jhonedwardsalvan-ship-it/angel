import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { deleteColorAction, saveColorAction } from "@/lib/admin/actions/colors";
import { listColors } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";
import type { AdminColor } from "@/types/admin";

export const metadata = { title: "Colors" };

/** Name, swatch, kind and where it's offered. Shared by the new-color row and each existing row. */
function ColorFields({ color }: { color?: AdminColor }) {
  return (
    <>
      <input type="color" name="hex" defaultValue={color?.hex ?? "#e8a0bf"} aria-label="Swatch" className="h-10 w-12 cursor-pointer rounded-control border border-line bg-canvas p-1" />
      <input name="name" required maxLength={30} defaultValue={color?.name} placeholder="Name, e.g. Blush pink" aria-label="Name" className="input py-2 text-sm" />
      <select name="kind" defaultValue={color?.kind ?? "flower"} aria-label="Used for" className="input py-2 text-sm">
        <option value="flower">Flower color</option>
        <option value="wrapper">Wrapper color</option>
      </select>
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
      <form action={saveColorAction} className="grid gap-2 sm:grid-cols-[3rem_1fr_9rem_11rem_auto_auto] sm:items-center">
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
  const groups = [
    { kind: "flower", title: "Flower colors" },
    { kind: "wrapper", title: "Wrapper colors" },
  ] as const;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Colors"
        description="Flower and wrapper colors buyers choose from (1 or 2 of each). Offer a color on all products, or tick it on specific products in the product form."
      />
      <Flash notice={params.notice} error={params.error} />

      <section aria-labelledby="new-color" className="panel stack mb-8 gap-3">
        <h2 id="new-color" className="text-h4">New color</h2>
        <form action={saveColorAction} className="grid gap-2 sm:grid-cols-[3rem_1fr_9rem_11rem_auto] sm:items-center">
          <ColorFields />
          <button type="submit" className="btn btn-primary btn-sm">Add</button>
        </form>
      </section>

      {groups.map(({ kind, title }) => {
        const list = colors.filter((c) => c.kind === kind);
        return (
          <section key={kind} aria-label={title} className="stack mb-8 gap-3">
            <h2 className="text-h4">{title}</h2>
            {list.length === 0 ? (
              <p className="panel text-sm text-ink-muted">None yet.</p>
            ) : (
              <ul className="stack gap-3">{list.map((c) => <ColorRow key={c.id} color={c} />)}</ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
