import Image from "next/image";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { deleteCategoryAction } from "@/lib/admin/actions/categories";
import { listCategories } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";
import { readPage, readPageSize } from "@/lib/admin/pagination";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdmin("/admin/categories");
  const [params, allCategories] = await Promise.all([searchParams, listCategories()]);
  const pageSize = readPageSize(params.limit);
  const pages = Math.max(1, Math.ceil(allCategories.length / pageSize));
  const page = Math.min(pages, readPage(params.page));
  const categories = allCategories.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHeader
        title="Categories"
        description="Collections shown on the homepage and at /collections/<slug>."
        actions={<Link href="/admin/categories/new" className="btn btn-primary btn-sm">New category</Link>}
      />
      <Flash notice={params.notice} error={params.error} />

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th className="num">Products</th>
              <th className="num">Order</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className={c.isActive ? "" : "text-ink-muted"}>
                <td>
                  <div className="flex min-w-56 items-center gap-3">
                    <div className="media size-12 shrink-0">
                      <Image src={c.image.src} alt="" fill sizes="48px" />
                    </div>
                    <div>
                      <Link href={`/admin/categories/${c.id}`} className="font-medium text-ink hover:underline">{c.name}</Link>
                      <div className="text-xs text-ink-muted">/collections/{c.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="num">{c.productCount}</td>
                <td className="num">{c.sortOrder}</td>
                <td><span className={`badge ${c.isActive ? "badge-success" : "badge-neutral"}`}>{c.isActive ? "Live" : "Hidden"}</span>{c.showInMenu && c.isActive && <span className="badge badge-info ml-2">In menu</span>}</td>
                <td>
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link href={`/admin/categories/${c.id}`} className="link">Edit</Link>
                    {c.productCount === 0 ? (
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="link text-danger">Delete</button>
                      </form>
                    ) : (
                      <span className="text-xs text-ink-subtle" title="Move or delete its products first">In use</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} limit={pageSize} href={(p) => `/admin/categories?${new URLSearchParams({ ...(pageSize !== 20 && { limit: String(pageSize) }), page: String(p) })}`} />
    </>
  );
}
