import "server-only";
import { cookies } from "next/headers";

// Order numbers this browser may view on /orders/<number> without signing in.
// Added after a successful order-number + phone lookup, and right after checkout.
// Keeps phone numbers out of URLs.

const COOKIE = "al_tracked_orders";
const MAX_ORDERS = 20;

export async function readTrackedOrders(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((n): n is string => typeof n === "string").slice(0, MAX_ORDERS) : [];
  } catch {
    return [];
  }
}

/** Server Functions only. */
export async function allowTrackedOrder(number: string) {
  const list = [number, ...(await readTrackedOrders()).filter((n) => n !== number)].slice(0, MAX_ORDERS);
  (await cookies()).set(COOKIE, JSON.stringify(list), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
