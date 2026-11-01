import type { Metadata } from "next";
import Link from "next/link";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { OrderSummary } from "@/components/cart/order-summary";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getCart } from "@/lib/cart/get-cart";

export const metadata: Metadata = {
  title: "Your cart · AL",
  robots: { index: false },
};

export default async function CartPage() {
  const cart = await getCart();

  return (
    <div className="container-page pt-4 pb-(--section-y) md:pt-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />

      <header className="stack mb-6 gap-3 md:mb-10">
        <p className="eyebrow">Your cart</p>
        <h1 className="text-h2">
          {cart.itemCount > 0
            ? `${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`
            : "Your cart is empty"}
        </h1>
      </header>

      {cart.lines.length === 0 ? (
        <div className="stack items-center gap-4 rounded-card bg-surface px-6 py-16 text-center">
          <h2 className="text-h3">Nothing here yet</h2>
          <p className="max-w-sm text-ink-muted">
            Browse our bouquets and add something lovely for someone special.
          </p>
          <Link href="/collections/new" className="btn btn-primary">
            Shop new arrivals
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <ul className="border-t border-line">
            {cart.lines.map((line) => (
              <CartLineItem key={line.key} line={line} />
            ))}
          </ul>

          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <OrderSummary
              subtotal={cart.subtotal}
              deliveryFee={cart.deliveryFee}
              freeDeliveryMin={cart.freeDeliveryMin}
              total={cart.total}
              footer={
                <div className="stack gap-3">
                  {cart.hasIssues ? (
                    <>
                      <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
                        Proceed to checkout
                      </button>
                      <p className="text-xs text-danger">Fix the items marked above to continue.</p>
                    </>
                  ) : (
                    <Link href="/checkout" className="btn btn-primary btn-lg btn-block">
                      Proceed to checkout
                    </Link>
                  )}
                  <Link href="/search" className="link w-fit self-center text-sm">
                    Continue shopping
                  </Link>
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
