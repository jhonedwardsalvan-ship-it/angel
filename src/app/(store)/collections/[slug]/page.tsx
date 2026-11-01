import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/product/product-listing";
import { getCategoryBySlug, getProductsByCategory } from "@/lib/catalog/queries";

// Render per request so catalog and stock changes show up immediately.
export const dynamic = "force-dynamic";

const PAGE_LIMIT = 48;

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) return {};
  return {
    title: `${category.name} · Angel`,
    description: category.description,
    openGraph: { images: [category.image.src] },
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category, PAGE_LIMIT);

  return (
    <ProductListing
      breadcrumbs={[{ label: "Home", href: "/" }, { label: category.name }]}
      eyebrow="Collection"
      title={category.name}
      description={category.description}
      products={products}
      empty={{
        title: "Nothing here right now",
        body: "This collection is being restocked. Take a look at what just arrived.",
        action: { label: "Shop new arrivals", href: "/collections/new" },
      }}
    />
  );
}
