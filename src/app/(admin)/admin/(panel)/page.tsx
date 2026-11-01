import Link from "next/link";
import { OrderStatusPill } from "@/components/admin/order-status-pill";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { getDashboardStats, listOrders, listProducts } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Dashboard" };

const dateTime = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

export default async function AdminDashboard() {
  await requireAdmin();
  const [stats, recent, lowStock] = await Promise.all([
    getDashboardStats(),
    listOrders({ page: 1 }),
    listProducts({ status: "low" }),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" description="Today at a glance. Payments are demo-only." />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard label="Pending orders" value={stats.pendingOrders} href="/admin/orders?status=pending" tone={stats.pendingOrders ? "warning" : "default"} hint="Waiting for confirmation" />
        <StatCard label="Orders today" value={stats.ordersToday} href="/admin/orders" />
        <StatCard label="Sales, 30 days" value={formatPrice(stats.revenue30d)} hint={`${stats.orders30d} orders, excluding cancelled`} />
        <StatCard label="Products live" value={stats.activeProducts} href="/admin/products" hint={`${stats.hiddenProducts} hidden`} />
        <StatCard label="Low stock" value={stats.lowStock} href="/admin/inventory?filter=low" tone={stats.lowStock ? "warning" : "default"} hint="5 or fewer left" />
        <StatCard label="Sold out" value={stats.soldOut} href="/admin/inventory?filter=out" tone={stats.soldOut ? "danger" : "default"} hint="Live products at 0" />
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="recent-title" className="stack gap-4">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-title" className="text-h4">Recent orders</h2>
            <Link href="/admin/orders" className="link text-sm">All orders</Link>
          </div>
          {recent.orders.length === 0 ? (
            <p className="panel text-sm text-ink-muted">No orders yet. They appear here as soon as a customer checks out.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th></tr>
                </thead>
                <tbody>
                  {recent.orders.slice(0, 8).map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className="link font-medium">{o.number}</Link>
                        <div className="text-xs text-ink-muted">{dateTime.format(new Date(o.createdAt))}</div>
                      </td>
                      <td>{o.customerName}</td>
                      <td><OrderStatusPill status={o.status} /></td>
                      <td className="num">{formatPrice(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="low-title" className="stack gap-4">
          <div className="flex items-baseline justify-between">
            <h2 id="low-title" className="text-h4">Running low</h2>
            <Link href="/admin/inventory" className="link text-sm">Inventory</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="panel text-sm text-ink-muted">Nothing is running low.</p>
          ) : (
            <ul className="table-wrap divide-y divide-line">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <Link href={`/admin/inventory?q=${encodeURIComponent(p.name)}`} className="hover:underline">{p.name}</Link>
                  <span className="stock stock-low tabular-nums">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
