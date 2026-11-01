import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/layout/breadcrumbs";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/catalog";

type ProductListingProps = {
  breadcrumbs: Crumb[];
  eyebrow: string;
  title: string;
  description?: string;
  products: Product[];
  empty: {
    title: string;
    body: string;
    action: { label: string; href: string };
  };
  /** Optional controls (search, filters) between the heading and the grid. */
  toolbar?: ReactNode;
};

/** Full-page product listing: breadcrumb, heading, count and product grid. */
export function ProductListing({
  breadcrumbs,
  eyebrow,
  title,
  description,
  products,
  empty,
  toolbar,
}: ProductListingProps) {
  return (
    <div className="container-page pt-4 pb-(--section-y) md:pt-6">
      <Breadcrumbs items={breadcrumbs} />

      <header className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="stack max-w-xl gap-3">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description && <p className="text-ink-muted">{description}</p>}
        </div>
        {products.length > 0 && (
          <p className="text-sm text-ink-muted">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        )}
      </header>

      {toolbar && <div className="mb-8 md:mb-10">{toolbar}</div>}

      {products.length > 0 ? (
        <ul className="grid-products">
          {products.map((product, i) => (
            <li key={product.id}>
              <ProductCard product={product} preload={i < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="stack items-center gap-4 rounded-card bg-surface px-6 py-16 text-center">
          <h2 className="text-h3">{empty.title}</h2>
          <p className="max-w-sm text-ink-muted">{empty.body}</p>
          <Link href={empty.action.href} className="btn btn-primary">
            {empty.action.label}
          </Link>
        </div>
      )}
    </div>
  );
}
