import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductSection } from "@/components/home/product-section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CardIcon, TruckIcon } from "@/components/icons";
import { AddToCart } from "@/components/product/add-to-cart";
import { ProductGallery } from "@/components/product/product-gallery";
import { StockStatus } from "@/components/product/stock-status";
import { formatPrice } from "@/lib/format";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/queries";

// Render per request so price and stock are always current.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: `${product.name} · Angel`,
    description: product.description,
    openGraph: { images: [product.images[0].src] },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const { category } = product;
  const categoryHref = `/collections/${category.slug}`;
  const onSale =
    product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
  const related = await getRelatedProducts(product);

  return (
    <>
      <div className="container-page pt-4 pb-(--section-y) md:pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: category.name, href: categoryHref },
            { label: product.name },
          ]}
        />

        <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <ProductGallery images={product.images} />

          <div className="stack gap-6 md:sticky md:top-[calc(var(--header-h)+1.5rem)] md:self-start">
            <div className="stack gap-3">
              <Link href={categoryHref} className="eyebrow w-fit hover:text-ink">
                {category.name}
              </Link>
              <h1 className="text-h2">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <p className="price text-h4 md:text-h4">
                  <span className={onSale ? "price-sale" : undefined}>
                    {onSale && <span className="sr-only">Sale price </span>}
                    {formatPrice(product.price)}
                  </span>
                  {onSale && (
                    <s className="price-compare">
                      <span className="sr-only">Regular price </span>
                      {formatPrice(product.compareAtPrice!)}
                    </s>
                  )}
                </p>
                {onSale && (
                  <span className="badge badge-sale">
                    Save {formatPrice(product.compareAtPrice! - product.price)}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted">
                Tax included. Delivery fee calculated at checkout.
              </p>
            </div>

            <StockStatus product={product} />

            <p className="text-ink-muted">{product.description}</p>

            <AddToCart productId={product.id} price={product.price} stock={product.stock} />

            <ul className="stack gap-3 rounded-card bg-surface p-4 text-sm md:p-5">
              <li className="flex gap-3">
                <TruckIcon className="shrink-0 text-primary" />
                <span>
                  <strong className="font-medium">Same-day delivery</strong> on
                  orders placed before 2 PM. Free over ₱2,500.
                </span>
              </li>
              <li className="flex gap-3">
                <CardIcon className="shrink-0 text-primary" />
                <span>
                  <strong className="font-medium">Free message card</strong>,
                  handwritten and tucked into the wrap.
                </span>
              </li>
            </ul>

            <div className="accordion-group">
              <details className="accordion" open>
                <summary>Details</summary>
                <ul className="stack gap-2">
                  {product.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                  <li>Category: {category.name}</li>
                </ul>
              </details>
              <details className="accordion">
                <summary>Care guide</summary>
                <p>
                  Trim stems at an angle and place in clean, cool water as soon
                  as they arrive. Refresh the water every two days and keep
                  away from direct sun and ripening fruit.
                </p>
              </details>
              <details className="accordion">
                <summary>Delivery &amp; returns</summary>
                <p>
                  We deliver daily from 9 AM to 7 PM. Fresh flowers can&apos;t
                  be returned, but if anything arrives less than perfect,
                  send us a photo within 24 hours and we&apos;ll replace it.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      <ProductSection
        id="related-title"
        eyebrow="You may also like"
        title={`More from ${category.name}`}
        products={related}
        href={categoryHref}
        banded
      />
    </>
  );
}
