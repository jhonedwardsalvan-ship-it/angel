import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { getNewArrivals } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "New arrivals · AL",
  description: "The latest handmade bouquets and gifts, newest first.",
};

// Render per request so newly added products and stock show up immediately.
export const dynamic = "force-dynamic";

const PAGE_LIMIT = 48;

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(PAGE_LIMIT);

  return (
    <ProductListing
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "New arrivals" }]}
      eyebrow="Just in"
      title="New arrivals"
      description="The latest handmade blooms and gifts from our studio. Newest first."
      products={products}
      empty={{
        title: "Nothing new just yet",
        body: "New pieces are on the way. In the meantime, browse our best sellers.",
        action: { label: "Shop best sellers", href: "/#best-sellers-title" },
      }}
    />
  );
}
