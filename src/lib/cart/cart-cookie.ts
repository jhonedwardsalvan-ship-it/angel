import "server-only";
import { cookies } from "next/headers";
import { MAX_QUANTITY, type LineConfig } from "@/lib/catalog/configure";

// Temporary cart storage: a cookie holding product ids, quantities and the
// buyer's options. Prices, names and stock are always re-read from the database.

export type CartEntry = { productId: string; quantity: number } & LineConfig;

const COOKIE = "angel_cart";
const MAX_LINES = 30;
const OBJECT_ID = /^[a-f0-9]{24}$/;
const ADD_ON_ID = OBJECT_ID;

function parseAddOns(value: unknown): LineConfig["addOns"] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((a) => typeof a?.id === "string" && ADD_ON_ID.test(a.id) && Number.isInteger(a.qty) && a.qty > 0)
    .map((a) => ({ id: a.id as string, qty: a.qty as number }))
    .slice(0, 10);
}

function parseIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && OBJECT_ID.test(id)).slice(0, 2) : [];
}

/** Reads the cart cookie, dropping anything malformed. */
export async function readCart(): Promise<CartEntry[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => typeof e?.productId === "string" && OBJECT_ID.test(e.productId) && Number.isInteger(e.quantity) && e.quantity > 0)
      .map((e) => ({
        productId: e.productId as string,
        quantity: Math.min(e.quantity as number, MAX_QUANTITY),
        pieces: Number.isInteger(e.pieces) && e.pieces > 0 ? (e.pieces as number) : undefined,
        addOns: parseAddOns(e.addOns),
        flowerColors: parseIds(e.flowerColors),
        wrapperColors: parseIds(e.wrapperColors),
      }))
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
