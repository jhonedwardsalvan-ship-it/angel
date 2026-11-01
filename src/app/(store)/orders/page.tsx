import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusPill } from "@/components/admin/order-status-pill";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TrackOrderForm } from "@/components/orders/track-order-form";
import { formatPrice } from "@/lib/format";
import { listOrdersForUser } from "@/lib/orders/queries";
import { getSession } from "@/lib/session";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track an order · AL",
  robots: { index: false },
};

const shortDate = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function OrdersPage() {
  const session = await getSession();
  const orders = session ? await listOrdersForUser(session.user.id) : [];

  return (
    <div className="container-prose pt-4 pb-(--section-y) md:pt-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track an order" }]} />

      <header className="stack mb-8 gap-3 md:mb-10">
        <p className="eyebrow">Orders</p>
        <h1 className="text-h2">Track an order</h1>
      </header>

      <div className="stack gap-10">
        {session && (
          <section aria-labelledby="your-orders-title" className="stack gap-4">
            <h2 id="your-orders-title" className="text-h4">Your orders</h2>
            {orders.length === 0 ? (
              <p className="text-ink-muted">
                No orders on this account yet. Placed an order without signing in? Look it up below.
              </p>
            ) : (
              <ul className="stack gap-3">
                {orders.map((o) => (
                  <li key={o.number}>
                    <Link href={`/orders/${o.number}`} className="panel flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-line-strong">
                      <span className="stack gap-1">
                        <span className="font-medium tabular-nums">{o.number}</span>
                        <span className="text-sm text-ink-muted">
                          Delivery {shortDate.format(new Date(`${o.deliveryDate}T00:00:00Z`))} · {o.itemCount}{" "}
                          {o.itemCount === 1 ? "item" : "items"} · {formatPrice(o.total)}
                        </span>
                      </span>
                      <OrderStatusPill status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section aria-labelledby="lookup-title" className="panel stack gap-5">
          <div className="stack gap-1">
            <h2 id="lookup-title" className="text-h4">{session ? "Look up another order" : "Find your order"}</h2>
            <p className="text-sm text-ink-muted">
              Enter the order number from your confirmation and the phone number you used at checkout.
              {!session && (
                <>
                  {" "}Have an account? <Link href="/login?next=/orders" className="link">Sign in</Link> to see all your orders.
                </>
              )}
            </p>
          </div>
          <TrackOrderForm />
        </section>

        <p className="text-sm text-ink-muted">
          Lost your order number? Call or text us at{" "}
          <a href={SITE.phoneHref} className="link">{SITE.phone}</a>.
        </p>
      </div>
    </div>
  );
}
