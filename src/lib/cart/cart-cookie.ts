import "server-only";
import { cookies } from "next/headers";
import { MAX_QUANTITY_PER_LINE } from "./pricing";

// Temporary cart storage: a cookie holding only product ids and quantities.
// Prices, names and stock are always re-read from the database.

export type CartEntry = { productId: string; quantity: number };

const COOKIE = "angel_cart";
const MAX_LINES = 30;
const OBJECT_ID = /^[a-f0-9]{24}$/;

/** Reads the cart cookie, dropping anything malformed. */
export async function readCart(): Promise<CartEntry[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is CartEntry =>
          typeof e?.productId === "string" &&
          OBJECT_ID.test(e.productId) &&
          Number.isInteger(e.quantity) &&
          e.quantity > 0,
      )
      .map((e) => ({ productId: e.productId, quantity: Math.min(e.quantity, MAX_QUANTITY_PER_LINE) }))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

/** Server Functions only: Next.js can't set cookies while rendering. */
export async function writeCart(entries: CartEntry[]) {
  const store = await cookies();
  if (entries.length === 0) {
    store.delete(COOKIE);
    return;
  }
  store.set(COOKIE, JSON.stringify(entries.slice(0, MAX_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
