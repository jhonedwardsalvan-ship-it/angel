import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";

export { ORDER_STATUS_LABELS };

const TONE: Record<OrderStatus, string> = {
  pending: "badge-warning",
  confirmed: "badge-info",
  preparing: "badge-info",
  out_for_delivery: "badge-info",
  delivered: "badge-success",
  cancelled: "badge-neutral",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <span className={`badge ${TONE[status]}`}>{ORDER_STATUS_LABELS[status]}</span>;
}
