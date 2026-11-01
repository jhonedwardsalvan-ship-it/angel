import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getCategory } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/categories/${id}`);
  const category = await getCategory(id);
  if (!category) notFound();

  return (
    <div className="max-w-2xl">
      <Breadcrumbs items={[{ label: "Categories", href: "/admin/categories" }, { label: category.name }]} />
      <PageHeader
        title={category.name}
        actions={
          category.isActive ? (
            <Link href={`/collections/${category.slug}`} className="btn btn-outline btn-sm" target="_blank">View in store</Link>
          ) : (
            <span className="badge badge-neutral">Hidden from store</span>
          )
        }
      />
      <CategoryForm category={category} />
    </div>
  );
}
