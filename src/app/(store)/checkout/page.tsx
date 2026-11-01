import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { OrderSummary } from "@/components/cart/order-summary";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getCart } from "@/lib/cart/get-cart";
import { MAX_DELIVERY_DAYS_AHEAD, storeDate } from "@/lib/checkout/delivery";
import { formatPrice } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Checkout · AL",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [cart, session, settings] = await Promise.all([getCart(), getSession(), getStoreSettings()]);
  // Empty carts and carts with stock problems are sorted out on /cart first.
  if (cart.lines.length === 0 || cart.hasIssues) redirect("/cart");

  return (
    <div className="container-page pt-4 pb-(--section-y) md:pt-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} />

      <header className="stack mb-6 gap-3 md:mb-10">
        <p className="eyebrow">Order request</p>
        <h1 className="text-h2">Checkout</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="order-2 lg:order-1">
          <CheckoutForm
            total={cart.total}
            minDate={storeDate(settings.leadDays)}
            leadDays={settings.leadDays}
            maxDate={storeDate(MAX_DELIVERY_DAYS_AHEAD)}
            defaults={{ name: session?.user.name, email: session?.user.email }}
          />
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <OrderSummary subtotal={cart.subtotal} deliveryFee={cart.deliveryFee} freeDeliveryMin={cart.freeDeliveryMin} total={cart.total}>
            <ul className="stack gap-4">
              {cart.lines.map(({ product, quantity, lineTotal }) => (
                <li key={product.id} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 text-sm">
                  <div className="media relative">
                    <Image src={product.images[0].src} alt="" fill sizes="56px" />
                    <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-pill bg-ink-muted text-[11px] text-ink-inverse">
                      {quantity}
                    </span>
                  </div>
                  <span>
                    {product.name}
                    <span className="sr-only">, quantity {quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatPrice(lineTotal)}</span>
                </li>
              ))}
            </ul>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
