import Image from "next/image";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { setProductActiveAction } from "@/lib/admin/actions/products";
import { listProducts, type ProductFilter } from "@/lib/admin/queries";
import { getStockState } from "@/lib/catalog/stock";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Products" };

const FILTERS: { value: NonNullable<ProductFilter["status"]>; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Live" },
  { value: "hidden", label: "Hidden" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Sold out" },
];

const STOCK_CLASS = { "in-stock": "stock-in", "low-stock": "stock-low", "sold-out": "stock-out" } as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin("/admin/products");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const status = FILTERS.find((f) => f.value === params.status)?.value ?? "";
  const products = await listProducts({ q, status });
  const href = (s: string) => `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(s && { status: s }) })}`;

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} shown`}
        actions={<Link href="/admin/products/new" className="btn btn-primary btn-sm">New product</Link>}
      />
      <Flash notice={params.notice} error={params.error} />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <li key={f.label}>
              <Link href={href(f.value)} aria-current={status === f.value ? "page" : undefined} className="chip min-h-9 px-3 text-xs">
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
        <form action="/admin/products" className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="admin-q" className="sr-only">Search products</label>
          <input id="admin-q" name="q" type="search" defaultValue={q} placeholder="Search by name" className="input min-h-10 py-2 text-sm md:w-64" />
          <button type="submit" className="btn btn-outline btn-sm">Search</button>
        </form>
      </div>

      {products.length === 0 ? (
        <p className="panel text-sm text-ink-muted">No products match. <Link href="/admin/products" className="link">Clear filters</Link></p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.isActive ? "" : "text-ink-muted"}>
                  <td>
                    <div className="flex min-w-56 items-center gap-3">
                      <div className="media size-12 shrink-0">
                        {p.image && <Image src={p.image} alt="" fill sizes="48px" />}
                      </div>
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:underline">{p.name}</Link>
                        <div className="text-xs text-ink-muted">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{p.category?.name ?? "—"}</td>
                  <td className="num">
                    {formatPrice(p.price)}
                    {p.compareAtPrice && <div className="text-xs text-ink-subtle line-through">{formatPrice(p.compareAtPrice)}</div>}
                  </td>
                  <td><span className={`stock ${STOCK_CLASS[getStockState(p)]} tabular-nums`}>{p.stock}</span></td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <span className={`badge ${p.isActive ? "badge-success" : "badge-neutral"}`}>{p.isActive ? "Live" : "Hidden"}</span>
                      {p.isFeatured && <span className="badge badge-info">Featured</span>}
                      {p.isNewArrival && <span className="badge badge-info">New</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                      <Link href={`/admin/products/${p.id}`} className="link">Edit</Link>
                      <form action={setProductActiveAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="active" value={String(!p.isActive)} />
                        <button type="submit" className="link text-ink-muted">{p.isActive ? "Hide" : "Show"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
