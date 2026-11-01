import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/flash";
import { ORDER_STATUS_LABELS, OrderStatusPill } from "@/components/admin/order-status-pill";
import { PageHeader } from "@/components/admin/page-header";
import { OrderSummary } from "@/components/cart/order-summary";
import { FormField } from "@/components/forms/form-field";
import { SelectField } from "@/components/forms/select-field";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { updateOrderStatusAction, updateTrackingAction } from "@/lib/admin/actions/orders";
import { getOrder } from "@/lib/admin/queries";
import { DELIVERY_SLOTS, PAYMENT_METHODS } from "@/lib/checkout/delivery";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { COURIERS, courierLabel } from "@/lib/orders/couriers";
import { ORDER_TRANSITIONS } from "@/lib/orders/status";

export const metadata = { title: "Order" };

const dateTime = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

const ACTION_LABELS: Record<string, string> = {
  confirmed: "Confirm order",
  preparing: "Payment received — start preparing",
  out_for_delivery: "Mark out for delivery",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
};

const COURIER_OPTIONS = Object.entries(COURIERS).map(([value, label]) => ({ value, label }));

/** Courier + tracking link inputs, used when marking out for delivery and when editing later. */
function TrackingFields({ courier = "", url = "" }: { courier?: string; url?: string }) {
  return (
    <>
      <SelectField label="Courier" name="courier" options={COURIER_OPTIONS} placeholder="Choose courier" defaultValue={courier} />
      <FormField
        label="Rider tracking link"
        name="trackingUrl"
        type="url"
        inputMode="url"
        placeholder="https://…"
        defaultValue={url}
        hint="Paste the live tracking link from Lalamove, Grab, J&T, etc. The buyer sees it on their order page. Leave empty if there's none."
      />
    </>
  );
}

export default async function AdminOrderPage({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireAdmin(`/admin/orders/${id}`);
  const order = await getOrder(id);
  if (!order) notFound();
  const next = ORDER_TRANSITIONS[order.status];

  return (
    <>
      <Breadcrumbs items={[{ label: "Orders", href: "/admin/orders" }, { label: order.number }]} />
      <PageHeader
        title={`Order ${order.number}`}
        description={`Placed ${dateTime.format(new Date(order.createdAt))}`}
        actions={<OrderStatusPill status={order.status} />}
      />
      <Flash notice={query.notice} error={query.error} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="stack gap-6">
          <section aria-labelledby="items-title" className="stack gap-3">
            <h2 id="items-title" className="text-h4">Items</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Product</th><th className="num">Price</th><th className="num">Qty</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {order.items.map((i, n) => (
                    <tr key={`${i.productId}-${n}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="media size-10 shrink-0">{i.image && <Image src={i.image} alt="" fill sizes="40px" />}</div>
                          <div>
                            <Link href={`/admin/products/${i.productId}`} className="hover:underline">{i.name}</Link>
                            {i.options.length > 0 && <div className="text-xs text-ink-muted">{i.options.join(" · ")}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="num">{formatPrice(i.unitPrice)}</td>
                      <td className="num">{i.quantity}</td>
                      <td className="num">{formatPrice(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ink-muted">Prices are what the customer paid at checkout, even if the product changed since.</p>
          </section>

          <section aria-labelledby="details-title" className="panel">
            <h2 id="details-title" className="mb-5 text-h4">Customer &amp; delivery</h2>
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              <div className="stack gap-1"><dt className="eyebrow">Customer</dt><dd>{order.customerName}<br /><a href={`mailto:${order.customerEmail}`} className="link">{order.customerEmail}</a><br /><a href={`tel:${order.customerPhone}`} className="link">{order.customerPhone}</a></dd></div>
              <div className="stack gap-1"><dt className="eyebrow">Account</dt><dd>{order.userId ? "Signed-in customer" : "Guest checkout"}</dd></div>
              <div className="stack gap-1"><dt className="eyebrow">Recipient</dt><dd>{order.delivery.recipientName}<br />{order.delivery.address}<br />{order.delivery.city}</dd></div>
              <div className="stack gap-1"><dt className="eyebrow">Delivery</dt><dd>{order.delivery.date}<br />{DELIVERY_SLOTS[order.delivery.slot as keyof typeof DELIVERY_SLOTS] ?? order.delivery.slot}</dd></div>
              <div className="stack gap-1"><dt className="eyebrow">Payment</dt><dd>{PAYMENT_METHODS[order.paymentMethod]}<br /><span className="text-ink-muted">{order.paymentStatus === "demo" ? "Demo, nothing charged" : order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "cod" ? "Collect on delivery" : "Awaiting payment. Contact the buyer to arrange it."}</span></dd></div>
              <div className="stack gap-1"><dt className="eyebrow">Message card</dt><dd className="whitespace-pre-line">{order.cardMessage || <span className="text-ink-muted">None</span>}</dd></div>
              <div className="stack gap-1 sm:col-span-2"><dt className="eyebrow">Notes</dt><dd className="whitespace-pre-line">{order.notes || <span className="text-ink-muted">None</span>}</dd></div>
            </dl>
          </section>
        </div>

        <div className="stack gap-6 xl:sticky xl:top-6 xl:self-start">
          <section aria-labelledby="status-title" className="panel stack gap-4">
            <h2 id="status-title" className="text-h4">Update status</h2>
            {next.length === 0 ? (
              <p className="text-sm text-ink-muted">This order is {ORDER_STATUS_LABELS[order.status].toLowerCase()}. No further changes.</p>
            ) : (
              <div className="stack gap-2">
                {next.map((to) => (
                  <form key={to} action={updateOrderStatusAction} className={to === "out_for_delivery" ? "stack gap-4" : undefined}>
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="from" value={order.status} />
                    <input type="hidden" name="to" value={to} />
                    {to === "out_for_delivery" && <TrackingFields />}
                    <button type="submit" className={`btn btn-block ${to === "cancelled" ? "btn-ghost text-danger" : "btn-primary"}`}>
                      {ACTION_LABELS[to]}
                    </button>
                  </form>
                ))}
                {order.status === "pending" && (
                  <p className="text-xs text-ink-muted">Use “Payment received” once the buyer has paid. Preparation starts then.</p>
                )}
                {next.includes("cancelled") && (
                  <p className="text-xs text-ink-muted">Cancelling puts the items back in stock.</p>
                )}
              </div>
            )}
            <ol className="stack gap-2 border-t border-line pt-4 text-sm">
              {order.statusHistory.map((h, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{ORDER_STATUS_LABELS[h.status]}</span>
                  <span className="text-xs text-ink-muted">{dateTime.format(new Date(h.at))}</span>
                </li>
              ))}
            </ol>
          </section>

          {(order.status === "out_for_delivery" || order.status === "delivered") && (
            <section aria-labelledby="tracking-title" className="panel stack gap-4">
              <h2 id="tracking-title" className="text-h4">Delivery tracking</h2>
              {order.tracking.url ? (
                <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="link break-all text-sm">
                  {courierLabel(order.tracking.courier) || "Tracking link"}: {order.tracking.url}
                </a>
              ) : (
                <p className="text-sm text-ink-muted">No tracking link yet.</p>
              )}
              <form action={updateTrackingAction} className="stack gap-4">
                <input type="hidden" name="id" value={order.id} />
                <TrackingFields courier={order.tracking.courier} url={order.tracking.url} />
                <button type="submit" className="btn btn-outline btn-block">Save tracking link</button>
              </form>
            </section>
          )}

          <OrderSummary subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total} />
        </div>
      </div>
    </>
  );
}
