import "server-only";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/order";
import { describeOptions } from "@/lib/catalog/configure";
import { courierLabel } from "./couriers";
import type { OrderStatus } from "./status";

// Buyer-facing order reads for /orders. Unlike src/lib/admin/queries.ts these
// return only what the buyer needs: no user ids or admin ids.

type BuyerOrderRow = {
  _id: Types.ObjectId;
  number: string;
  userId?: string | null;
  customer: { name: string; phone: string };
  delivery: { recipientName: string; address: string; city: string; date: string; slot: string };
  cardMessage?: string;
  notes?: string;
  tracking?: { courier?: string; url?: string };
  payment: { method: string; status: string };
  items: { slug: string; name: string; image?: string; unitPrice: number; quantity: number; lineTotal: number; breakdown?: { label: string; amount: number }[] }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  statusHistory: { status: string; at: Date }[];
  createdAt: Date;
};

export type BuyerOrder = {
  number: string;
  createdAt: string;
  status: OrderStatus;
  isPaid: boolean;
  recipientName: string;
  address: string;
  city: string;
  deliveryDate: string;
  deliverySlot: string;
  cardMessage: string;
  notes: string;
  /** Courier label and live tracking link, once the order is out for delivery. */
  tracking: { courier: string; url: string };
  items: { slug: string; name: string; image: string; unitPrice: number; quantity: number; lineTotal: number; options: string[] }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  history: { status: OrderStatus; at: string }[];
};

export type BuyerOrderListItem = Pick<BuyerOrder, "number" | "createdAt" | "status" | "deliveryDate" | "total"> & {
  itemCount: number;
};

/** Digits only, last 10, so 0905…, +63905… and 63905… compare equal. */
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

/** Order numbers are stored upper-case, e.g. AL-MH3K2P9Q-1A2B. */
export function normalizeOrderNumber(number: string) {
  return number.trim().toUpperCase().replace(/\s+/g, "");
}

function toBuyerOrder(o: BuyerOrderRow): BuyerOrder {
  return {
    number: o.number,
    createdAt: o.createdAt.toISOString(),
    status: o.status as OrderStatus,
    isPaid: o.payment.status === "paid",
    recipientName: o.delivery.recipientName,
    address: o.delivery.address,
    city: o.delivery.city,
    deliveryDate: o.delivery.date,
    deliverySlot: o.delivery.slot,
    cardMessage: o.cardMessage ?? "",
    notes: o.notes ?? "",
    tracking: { courier: courierLabel(o.tracking?.courier ?? ""), url: o.tracking?.url ?? "" },
    items: o.items.map((i) => ({
      slug: i.slug,
      name: i.name,
      image: i.image ?? "",
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      options: describeOptions(i.breakdown ?? []),
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    history: o.statusHistory.map((h) => ({ status: h.status as OrderStatus, at: h.at.toISOString() })),
  };
}

export async function listOrdersForUser(userId: string): Promise<BuyerOrderListItem[]> {
  await connectDB();
  const rows = await Order.find({ userId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(50)
    .select("number createdAt status delivery.date total items.quantity")
    .lean<Pick<BuyerOrderRow, "number" | "createdAt" | "status" | "delivery" | "total" | "items">[]>();
  return rows.map((o) => ({
    number: o.number,
    createdAt: o.createdAt.toISOString(),
    status: o.status as OrderStatus,
    deliveryDate: o.delivery.date,
    total: o.total,
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
  }));
}

/** True when the number + phone pair matches an order. */
export async function matchGuestOrder(number: string, phone: string): Promise<boolean> {
  const digits = normalizePhone(phone);
  if (digits.length < 10) return false;
  await connectDB();
  const row = await Order.findOne({ number: normalizeOrderNumber(number) }, { "customer.phone": 1 }).lean<
    Pick<BuyerOrderRow, "customer">
  >();
  return !!row && normalizePhone(row.customer.phone) === digits;
}

/**
 * The order, if this viewer may see it: placed by the signed-in user, or
 * unlocked in this browser by a lookup or checkout (see ./tracking.ts).
 */
export async function getOrderForViewer(
  number: string,
  viewer: { userId?: string; trackedNumbers: string[] },
): Promise<BuyerOrder | null> {
  const n = normalizeOrderNumber(number);
  await connectDB();
  const row = await Order.findOne({ number: n }).lean<BuyerOrderRow>();
  if (!row) return null;
  const owns = !!viewer.userId && row.userId === viewer.userId;
  return owns || viewer.trackedNumbers.includes(n) ? toBuyerOrder(row) : null;
}
