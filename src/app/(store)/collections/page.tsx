import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CollectionCard } from "@/components/product/collection-card";
import { getCategories } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "All collections · AL",
  description: "Every AL Flower Shop collection in one place.",
};

// Render per request so collections added or hidden in the admin show up immediately.
export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await getCategories();

  return (
    <div className="container-page pt-4 pb-(--section-y) md:pt-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />

      <header className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="stack max-w-xl gap-3">
          <p className="eyebrow">Shop the collections</p>
          <h1>All collections</h1>
          <p className="text-ink-muted">Something for every moment. Pick a collection to see its pieces.</p>
        </div>
        {collections.length > 0 && (
          <p className="text-sm text-ink-muted">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        )}
      </header>

      {collections.length > 0 ? (
        <ul className="grid-collections">
          {collections.map((c) => (
            <li key={c.slug}>
              <CollectionCard collection={c} sizes="(min-width: 64rem) 33vw, 50vw" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="stack items-center gap-4 rounded-card bg-surface px-6 py-16 text-center">
          <h2 className="text-h3">Collections are on the way</h2>
          <p className="max-w-sm text-ink-muted">In the meantime, browse everything in the shop.</p>
          <Link href="/search" className="btn btn-primary">Shop all</Link>
        </div>
      )}
    </div>
  );
}
