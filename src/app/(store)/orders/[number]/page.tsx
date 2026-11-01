import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSummary } from "@/components/cart/order-summary";
import { OrderStatusPill } from "@/components/admin/order-status-pill";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DELIVERY_SLOTS } from "@/lib/checkout/delivery";
import { formatPrice } from "@/lib/format";
import { getOrderForViewer } from "@/lib/orders/queries";
import type { OrderStatus } from "@/lib/orders/status";
import { readTrackedOrders } from "@/lib/orders/tracking";
import { getSession } from "@/lib/session";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order details · AL",
  robots: { index: false },
};

const longDate = new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const stamp = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

/** Buyer-facing steps. Payment comes before preparation. */
const STEPS: { status: OrderStatus; title: string; body: string }[] = [
  { status: "pending", title: "Order received", body: "Our team will contact you to arrange payment." },
  { status: "preparing", title: "Payment confirmed, preparing", body: "Your flowers are being arranged." },
  { status: "out_for_delivery", title: "Out for delivery", body: "On the way to the recipient." },
  { status: "delivered", title: "Delivered", body: "Enjoy your flowers!" },
];
// Older orders may be "confirmed"; it sits at the first step.
const STEP_INDEX: Partial<Record<OrderStatus, number>> = { pending: 0, confirmed: 0, preparing: 1, out_for_delivery: 2, delivered: 3 };

export default async function OrderPage({ params }: PageProps<"/orders/[number]">) {
  const { number } = await params;
  const [session, trackedNumbers] = await Promise.all([getSession(), readTrackedOrders()]);
  const order = await getOrderForViewer(decodeURIComponent(number), { userId: session?.user.id, trackedNumbers });
  if (!order) notFound();

  const cancelled = order.status === "cancelled";
  const reached = STEP_INDEX[order.status] ?? 0;
  const at = (s: OrderStatus) => order.history.find((h) => h.status === s)?.at;

  return (
    <div className="container-prose pt-4 pb-(--section-y) md:pt-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track an order", href: "/orders" }, { label: order.number }]} />

      <header className="stack mb-8 gap-3 md:mb-10">
        <p className="eyebrow">Order</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h2 tabular-nums">{order.number}</h1>
          <OrderStatusPill status={order.status} />
        </div>
        <p className="text-sm text-ink-muted">Placed {stamp.format(new Date(order.createdAt))}</p>
      </header>

      <div className="stack gap-6">
        {cancelled ? (
          <p role="status" className="notice">
            This order was cancelled. Questions? Call or text <a href={SITE.phoneHref} className="link">{SITE.phone}</a>.
          </p>
        ) : (
          <section aria-labelledby="progress-title" className="panel">
            <h2 id="progress-title" className="mb-5 text-h4">Progress</h2>
            <ol className="stack gap-5">
              {STEPS.map((step, i) => {
                const done = i <= reached;
                const time = i === 0 ? order.createdAt : at(step.status);
                return (
                  <li key={step.status} className="flex gap-4" aria-current={i === reached ? "step" : undefined}>
                    <span
                      className={`mt-1 grid size-5 shrink-0 place-items-center rounded-pill border-2 ${done ? "border-primary bg-primary" : "border-line-strong"}`}
                      aria-hidden="true"
                    >
                      {done && <span className="size-2 rounded-pill bg-primary-foreground" />}
                    </span>
                    <span className="stack min-w-0 flex-1 gap-1">
                      <span className={done ? "font-medium" : "text-ink-muted"}>{step.title}</span>
                      {i === reached && (
                        <span className="text-sm text-ink-muted">
                          {step.status === "out_for_delivery" && order.tracking.courier
                            ? `On the way with ${order.tracking.courier}.`
                            : step.body}
                        </span>
                      )}
                      {done && time && <span className="text-xs text-ink-subtle">{stamp.format(new Date(time))}</span>}
                      {/* Rider tracking sits under its own step, above "Delivered". */}
                      {step.status === "out_for_delivery" && order.status === "out_for_delivery" && order.tracking.url && (
                        <span className="mt-2 stack gap-3 rounded-control bg-surface p-4">
                          <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm">
                              <strong className="font-medium">Your order is on the way.</strong> See where the rider is
                              {order.tracking.courier ? ` on ${order.tracking.courier}` : ""}.
                            </span>
                            <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm shrink-0">
                              Track your rider
                            </a>
                          </span>
                          <span className="text-xs text-ink-muted">
                            Tracking link:{" "}
                            <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="link break-all">
                              {order.tracking.url}
                            </a>
                          </span>
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
            {!order.isPaid && reached === 0 && (
              <p className="mt-6 rounded-control bg-surface px-4 py-3 text-sm">
                <strong className="font-medium">Awaiting payment.</strong> We&apos;ll contact you at the number you
                gave at checkout. Haven&apos;t heard from us? Call or text{" "}
                <a href={SITE.phoneHref} className="link">{SITE.phone}</a>.
              </p>
            )}
          </section>
        )}

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
                {DELIVERY_SLOTS[order.deliverySlot as keyof typeof DELIVERY_SLOTS] ?? order.deliverySlot}
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
            {order.cardMessage && (
              <div className="stack gap-1">
                <dt className="eyebrow">Card message</dt>
                <dd className="whitespace-pre-line">{order.cardMessage}</dd>
              </div>
            )}
          </dl>
        </section>

        <OrderSummary subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total}>
          <ul className="stack gap-3 text-sm">
            {order.items.map((item, n) => (
              <li key={`${item.slug}-${n}`} className="flex items-center gap-3">
                {item.image && (
                  <Image src={item.image} alt="" width={48} height={60} className="h-15 w-12 shrink-0 rounded-media object-cover" />
                )}
                <span className="flex-1">
                  <Link href={`/products/${item.slug}`} className="link-quiet">{item.name}</Link>{" "}
                  <span className="text-ink-muted">× {item.quantity}</span>
                  {item.options.length > 0 && <span className="block text-xs text-ink-muted">{item.options.join(" · ")}</span>}
                </span>
                <span className="tabular-nums">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </OrderSummary>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/orders" className="btn btn-outline">All orders</Link>
          <Link href="/" className="btn btn-ghost">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
