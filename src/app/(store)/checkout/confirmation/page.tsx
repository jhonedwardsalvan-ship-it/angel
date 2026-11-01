import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderSummary } from "@/components/cart/order-summary";
import { DELIVERY_SLOTS } from "@/lib/checkout/delivery";
import { readLastOrder } from "@/lib/checkout/last-order";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thank you · AL",
  robots: { index: false },
};

const longDate = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export default async function ConfirmationPage() {
  const order = await readLastOrder();
  if (!order) redirect("/");

  return (
    <div className="container-prose pt-10 pb-(--section-y) md:pt-16">
      <header className="stack mb-10 items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-pill bg-success/10 text-success" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <p className="eyebrow">Order request received</p>
        <h1 className="text-h2">Thank you, {order.name}!</h1>
        <div className="stack items-center gap-1">
          <p className="text-sm text-ink-muted">Your order number</p>
          <p className="text-h3 font-medium tracking-wide tabular-nums">{order.number}</p>
          <p className="mt-2 text-sm font-medium">Save this order number so you can track your order.</p>
          <p className="text-sm text-ink-muted">
            Track it anytime on the{" "}
            <Link href="/orders" className="link">Track an order page</Link>{" "}
            using this number and your phone number.
          </p>
        </div>
        <div className="stack max-w-md gap-2 rounded-card bg-surface p-4 text-left text-sm md:p-5">
          <p>
            <strong className="font-medium">Next step: payment.</strong> Our team will contact you at{" "}
            <strong className="font-medium">{order.phone}</strong> to arrange payment.
          </p>
          <p className="text-ink-muted">
            We start preparing the flowers for {order.recipientName} once payment is confirmed. Questions?
            Call or text <a href={SITE.phoneHref} className="link">{SITE.phone}</a>.
          </p>
        </div>
      </header>

      <div className="stack gap-6">
        <section aria-labelledby="delivery-title" className="panel">
          <h2 id="delivery-title" className="mb-5 text-h4">Delivery</h2>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <div className="stack gap-1">
              <dt className="eyebrow">Recipient</dt>
              <dd>{order.recipientName}</dd>
            </div>
            <div className="stack gap-1">
              <dt className="eyebrow">When</dt>
              <dd>
                {longDate.format(new Date(`${order.deliveryDate}T00:00:00Z`))}
                <br />
                {DELIVERY_SLOTS[order.deliverySlot]}
              </dd>
            </div>
            <div className="stack gap-1">
              <dt className="eyebrow">Address</dt>
              <dd>
                {order.address}
                <br />
                {order.city}
              </dd>
            </div>
            <div className="stack gap-1">
              <dt className="eyebrow">Payment</dt>
              <dd>Awaiting payment. Our team will contact you.</dd>
            </div>
          </dl>
        </section>

        <OrderSummary subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total}>
          <ul className="stack gap-3 text-sm">
            {order.items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex justify-between gap-4">
                <span>
                  {item.name} <span className="text-ink-muted">× {item.quantity}</span>
                </span>
                <span className="tabular-nums">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </OrderSummary>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/orders/${order.number}`} className="btn btn-primary">Track this order</Link>
          <Link href="/" className="btn btn-outline">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
