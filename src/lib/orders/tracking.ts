import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Order numbers this browser may view on /orders/<number> without signing in.
// Added after a successful order-number + phone lookup, and right after checkout.
// Keeps phone numbers out of URLs.
//
// The cookie is signed: without the signature anyone could write another
// buyer's order number into it and read their name, phone and address.

const COOKIE = "al_tracked_orders";
const MAX_ORDERS = 20;

const sign = (payload: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET).update(`tracked-orders:${payload}`).digest("base64url");

export async function readTrackedOrders(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return [];
  const payload = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(payload));
  // Unsigned (old) or tampered cookies count as empty; the buyer just looks the order up again.
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return [];
  try {
    const list = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Array.isArray(list) ? list.filter((n): n is string => typeof n === "string").slice(0, MAX_ORDERS) : [];
  } catch {
    return [];
  }
}

/** Server Functions only. */
export async function allowTrackedOrder(number: string) {
  const list = [number, ...(await readTrackedOrders()).filter((n) => n !== number)].slice(0, MAX_ORDERS);
  const payload = Buffer.from(JSON.stringify(list)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
