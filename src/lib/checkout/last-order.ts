import "server-only";
import { cookies } from "next/headers";

// The confirmation page reads a short-lived summary of the last order from this
// cookie, so it renders without a database lookup.

export type DeliverySlot = "morning" | "afternoon" | "evening";
export type PaymentMethod = "arranged" | "demo-card" | "cod";

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
  /** Where the team will contact the buyer about payment. */
  phone: string;
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
