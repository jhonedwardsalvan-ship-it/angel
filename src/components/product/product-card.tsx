import Image from "next/image";
import Link from "next/link";
import { hasStockLimit, startingPrice } from "@/lib/catalog/configure";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

type ProductCardProps = {
  product: Product;
  /** Responsive `sizes` hint; defaults to the product grid layout. */
  sizes?: string;
  portrait?: boolean;
  /** Load the image eagerly; use for cards above the fold. */
  preload?: boolean;
};

export function ProductCard({
  product,
  sizes = "(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw",
  portrait,
  preload = false,
}: ProductCardProps) {
  const onSale = product.compareAtPrice !== undefined && product.compareAtPrice > product.price;

  return (
    <Link href={`/products/${product.slug}`} className="card-product group">
      <div className={`media ${portrait ? "media-portrait" : ""}`}>
        <Image
          src={product.images[0].src}
          alt={product.images[0].alt}
          fill
          sizes={sizes}
          preload={preload}
          loading={preload ? "eager" : "lazy"}
        />
        {hasStockLimit(product) && product.stock <= 0 ? (
          <span className="badge badge-soldout badge-overlay">Sold out</span>
        ) : onSale ? (
          <span className="badge badge-sale badge-overlay">Sale</span>
        ) : product.isNewArrival ? (
          <span className="badge badge-overlay">New</span>
        ) : null}
      </div>
      <div className="stack gap-1">
        <h3 className="card-product-title group-hover:underline group-hover:underline-offset-4">
          {product.name}
        </h3>
        <p className="price">
          <span className={onSale ? "price-sale" : undefined}>
            {onSale && <span className="sr-only">Sale price </span>}
            {product.pricing === "per_piece" ? `From ${formatPrice(startingPrice(product))}` : formatPrice(product.price)}
          </span>
          {onSale && (
            <s className="price-compare">
              <span className="sr-only">Regular price </span>
              {formatPrice(product.compareAtPrice!)}
            </s>
          )}
        </p>
      </div>
    </Link>
  );
}
