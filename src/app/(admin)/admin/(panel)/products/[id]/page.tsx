import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getProduct, listAddOns, listCategories, listColors } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/products/${id}`);
  const [product, categories, addOns, colors] = await Promise.all([getProduct(id), listCategories(), listAddOns(), listColors()]);
  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <Breadcrumbs items={[{ label: "Products", href: "/admin/products" }, { label: product.name }]} />
      <PageHeader
        title={product.name}
        actions={
          product.isActive ? (
            <Link href={`/products/${product.slug}`} className="btn btn-outline btn-sm" target="_blank">View in store</Link>
          ) : (
            <span className="badge badge-neutral">Hidden from store</span>
          )
        }
      />
      <ProductForm product={product} addOns={addOns} colors={colors} categories={categories.map((c) => ({ value: c.id, label: c.isActive ? c.name : `${c.name} (hidden)` }))} />
    </div>
  );
}
