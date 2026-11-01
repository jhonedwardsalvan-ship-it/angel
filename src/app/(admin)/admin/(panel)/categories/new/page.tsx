import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requireAdmin("/admin/categories/new");
  return (
    <div className="max-w-2xl">
      <Breadcrumbs items={[{ label: "Categories", href: "/admin/categories" }, { label: "New category" }]} />
      <PageHeader title="New category" />
      <CategoryForm />
    </div>
  );
}
