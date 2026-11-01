import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { getFeaturedProducts } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "Best sellers · AL",
  description: "Our most-loved handmade bouquets and gifts.",
};

// Render per request so products marked Featured in the admin show up immediately.
export const dynamic = "force-dynamic";

const PAGE_LIMIT = 48;

export default async function BestSellersPage() {
  const products = await getFeaturedProducts(PAGE_LIMIT);

  return (
    <ProductListing
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Best sellers" }]}
      eyebrow="Most loved"
      title="Best sellers"
      description="The handmade pieces our customers come back for."
      products={products}
      empty={{
        title: "No best sellers yet",
        body: "Browse everything in the shop in the meantime.",
        action: { label: "Shop all", href: "/search" },
      }}
    />
  );
}
