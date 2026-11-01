import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { StockForm } from "@/components/admin/stock-form";
import { getRecentStockAdjustments, listProducts } from "@/lib/admin/queries";
import { getStockState, LOW_STOCK_THRESHOLD } from "@/lib/catalog/stock";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Inventory" };

const FILTERS = [
  { value: "", label: "All" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Sold out" },
] as const;

const STOCK_CLASS = { "in-stock": "stock-in", "low-stock": "stock-low", "sold-out": "stock-out" } as const;

const REASONS: Record<string, string> = {
  admin_set: "Set by admin",
  admin_adjust: "Adjusted by admin",
  order: "Order placed",
  order_cancelled: "Returned to stock",
};

const dateTime = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin("/admin/inventory");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const filter = FILTERS.find((f) => f.value === params.filter)?.value ?? "";
  const [products, history] = await Promise.all([
    listProducts({ q, status: filter }),
    getRecentStockAdjustments(25),
  ]);
  const href = (f: string) => `/admin/inventory?${new URLSearchParams({ ...(q && { q }), ...(f && { filter: f }) })}`;

  return (
    <>
      <PageHeader
        title="Inventory"
        description={`Low stock is ${LOW_STOCK_THRESHOLD} or fewer. Every change is logged below; orders take stock automatically and cancellations return it.`}
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <li key={f.label}>
              <Link href={href(f.value)} aria-current={filter === f.value ? "page" : undefined} className="chip min-h-9 px-3 text-xs">{f.label}</Link>
            </li>
          ))}
        </ul>
        <form action="/admin/inventory" className="flex gap-2" role="search">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <label htmlFor="inv-q" className="sr-only">Search products</label>
          <input id="inv-q" name="q" type="search" defaultValue={q} placeholder="Search by name" className="input min-h-10 py-2 text-sm md:w-64" />
          <button type="submit" className="btn btn-outline btn-sm">Search</button>
        </form>
      </div>

      {products.length === 0 ? (
        <p className="panel text-sm text-ink-muted">No products match. <Link href="/admin/inventory" className="link">Clear filters</Link></p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Product</th><th className="num">In stock</th><th>Update</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.isActive ? "" : "text-ink-muted"}>
                  <td className="min-w-48">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:underline">{p.name}</Link>
                    {!p.isActive && <span className="badge badge-neutral ml-2">Hidden</span>}
                  </td>
                  <td className="num"><span className={`stock ${STOCK_CLASS[getStockState(p)]}`}>{p.stock}</span></td>
                  <td><StockForm productId={p.id} productName={p.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section aria-labelledby="history-title" className="mt-10 stack gap-4">
        <h2 id="history-title" className="text-h4">Recent stock changes</h2>
        {history.length === 0 ? (
          <p className="panel text-sm text-ink-muted">No changes yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>When</th><th>Product</th><th>Reason</th><th className="num">Change</th><th className="num">Stock</th><th>Note</th></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap text-ink-muted">{dateTime.format(new Date(h.createdAt))}</td>
                    <td>{h.productName}</td>
                    <td className="whitespace-nowrap">{REASONS[h.reason] ?? h.reason}</td>
                    <td className={`num ${h.delta < 0 ? "text-danger" : "text-success"}`}>{h.delta > 0 ? `+${h.delta}` : h.delta}</td>
                    <td className="num text-ink-muted">{h.before} → {h.after}</td>
                    <td className="text-ink-muted">{h.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
