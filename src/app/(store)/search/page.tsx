import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { SearchControls } from "@/components/search/search-controls";
import { getCategories, searchProducts } from "@/lib/catalog/queries";
import { parseSearchParams } from "@/lib/catalog/search";

export const metadata: Metadata = {
  title: "Search · AL",
  robots: { index: false },
};

// Results depend on the query string and live stock.
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const filters = parseSearchParams(await searchParams);
  const [categories, products] = await Promise.all([getCategories(), searchProducts(filters)]);
  const filtered = Boolean(filters.q || filters.category || filters.inStock);

  return (
    <ProductListing
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      eyebrow="Search"
      title={filters.q ? `Results for “${filters.q}”` : "Shop all flowers"}
      description={filters.q ? undefined : "Search by name, or narrow down by collection, stock and price."}
      products={products}
      toolbar={
        <SearchControls
          filters={filters}
          categories={categories.map(({ slug, name }) => ({ slug, name }))}
        />
      }
      empty={{
        title: "No matches",
        body: filtered
          ? "Try another word, or clear the filters to see everything."
          : "There are no products to show yet.",
        action: { label: "Clear filters", href: "/search" },
      }}
    />
  );
}
