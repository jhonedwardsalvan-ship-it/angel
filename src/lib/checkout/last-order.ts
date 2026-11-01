import "server-only";
import { cookies } from "next/headers";

// Demo checkout keeps no orders in the database. The confirmation page reads
// a short-lived summary of the last order from this cookie instead.

export type DeliverySlot = "morning" | "afternoon" | "evening";
export type PaymentMethod = "demo-card" | "cod";

export type OrderSummary = {
  number: string;
  placedAt: string;
  name: string;
  email: string;
  recipientName: string;
  address: string;
  city: string;
  deliveryDate: string;
  deliverySlot: DeliverySlot;
  paymentMethod: PaymentMethod;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

const COOKIE = "angel_last_order";

export async function readLastOrder(): Promise<OrderSummary | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const order = JSON.parse(raw) as OrderSummary;
    return typeof order?.number === "string" && Array.isArray(order.items) ? order : null;
  } catch {
    return null;
  }
}

/** Server Functions only. */
export async function writeLastOrder(order: OrderSummary) {
  (await cookies()).set(COOKIE, JSON.stringify(order), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}
