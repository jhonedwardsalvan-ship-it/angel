import Link from "next/link";
import { ORDER_STATUS_LABELS, OrderStatusPill } from "@/components/admin/order-status-pill";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { listOrders } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders/status";
import { readPage, readPageSize } from "@/lib/admin/pagination";

export const metadata = { title: "Orders" };

const dateTime = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin("/admin/orders");
  const params = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === params.status) as OrderStatus | undefined;
  const page = readPage(params.page);
  const pageSize = readPageSize(params.limit);
  const { orders, total, pages } = await listOrders({ status, page, pageSize });
  const href = (s?: string, p = 1) =>
    `/admin/orders?${new URLSearchParams({ ...(s && { status: s }), ...(pageSize !== 20 && { limit: String(pageSize) }), ...(p > 1 && { page: String(p) }) })}`;

  return (
    <>
      <PageHeader title="Orders" description={`${total} ${status ? ORDER_STATUS_LABELS[status].toLowerCase() : "total"}. Payments are demo-only.`} />

      <ul className="mb-5 flex flex-wrap gap-2">
        {[undefined, ...ORDER_STATUSES].map((s) => (
          <li key={s ?? "all"}>
            <Link href={href(s)} aria-current={status === s ? "page" : undefined} className="chip min-h-9 px-3 text-xs">
              {s ? ORDER_STATUS_LABELS[s] : "All"}
            </Link>
          </li>
        ))}
      </ul>

      {orders.length === 0 ? (
        <p className="panel text-sm text-ink-muted">No orders here yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Delivery</th>
                <th className="num">Items</th>
                <th className="num">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                // The order link stretches over the whole row, so any cell opens the order.
                <tr key={o.id} className="relative cursor-pointer transition-colors hover:bg-surface">
                  <td className="whitespace-nowrap">
                    <Link href={`/admin/orders/${o.id}`} className="link font-medium after:absolute after:inset-0 after:content-['']">{o.number}</Link>
                    <div className="text-xs text-ink-muted">{dateTime.format(new Date(o.createdAt))}</div>
                  </td>
                  <td>
                    {o.customerName}
                    <div className="text-xs text-ink-muted">{o.customerEmail}</div>
                  </td>
                  <td className="whitespace-nowrap">{o.deliveryDate}</td>
                  <td className="num">{o.itemCount}</td>
                  <td className="num">
                    {formatPrice(o.total)}
                    <div className="text-xs text-ink-muted">{o.paymentStatus === "paid" ? "Paid" : o.paymentStatus === "demo" ? "Demo card" : o.paymentMethod === "cod" ? "Cash on delivery" : "Awaiting payment"}</div>
                  </td>
                  <td><OrderStatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={Math.min(page, pages)} pages={pages} limit={pageSize} href={(p) => href(status, p)} />
    </>
  );
}
