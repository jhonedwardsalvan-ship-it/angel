import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { listAddOns, listCategories } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin("/admin/products/new");
  const [categories, addOns] = await Promise.all([listCategories(), listAddOns()]);
  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ label: "Products", href: "/admin/products" }, { label: "New product" }]} />
      <PageHeader title="New product" />
      <ProductForm addOns={addOns} categories={categories.map((c) => ({ value: c.id, label: c.isActive ? c.name : `${c.name} (hidden)` }))} />
    </div>
  );
}
