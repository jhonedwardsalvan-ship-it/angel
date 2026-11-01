import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/catalog";
import { SectionHeading } from "./section-heading";

type ProductSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  products: Product[];
  href: string;
  /** "grid" wraps into rows; "rail" scrolls horizontally. */
  layout?: "grid" | "rail";
  banded?: boolean;
};

export function ProductSection({
  id,
  eyebrow,
  title,
  products,
  href,
  layout = "grid",
  banded,
}: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className={`section ${banded ? "bg-surface" : ""}`} aria-labelledby={id}>
      <div className="container-page">
        <SectionHeading id={id} eyebrow={eyebrow} title={title} action={{ label: "Shop all", href }} />
        {layout === "rail" ? (
          <ul className="rail -mx-(--gutter) px-(--gutter) scroll-px-(--gutter) md:mx-0 md:px-0 md:scroll-px-0">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  portrait
                  sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 46vw"
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid-products">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
