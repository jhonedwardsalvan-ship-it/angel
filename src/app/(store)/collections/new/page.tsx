import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { getNewArrivals } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "New arrivals · AL",
  description: "The latest bouquets, stems and gifts, newest first.",
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
      description="The latest additions to our studio, from seasonal stems to fresh takes on the classics. Newest first."
      products={products}
      empty={{
        title: "Nothing new just yet",
        body: "Fresh arrivals land every week. In the meantime, browse our best sellers.",
        action: { label: "Shop best sellers", href: "/#best-sellers-title" },
      }}
    />
  );
}
