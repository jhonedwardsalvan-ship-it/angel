"use server";

import { getProductsByIds } from "@/lib/catalog/queries";
import { lineKey, maxQuantity, normalizeConfig, type LineConfig } from "@/lib/catalog/configure";
import { readCart, writeCart } from "./cart-cookie";

export type AddToCartState = { status: "added" | "error"; message: string } | undefined;

function intField(formData: FormData, key: string) {
  const n = Number(formData.get(key));
  return Number.isInteger(n) ? n : NaN;
}

/** Form fields: productId, quantity, pieces (per-flower products), addon_<id> = flowers or 1. */
export async function addToCartAction(_prev: AddToCartState, formData: FormData): Promise<AddToCartState> {
  const productId = String(formData.get("productId") ?? "");
  const quantity = intField(formData, "quantity");
  if (!(quantity >= 1)) return { status: "error", message: "Choose a quantity." };

  const [product] = await getProductsByIds([productId]).catch(() => []);
  if (!product) return { status: "error", message: "This product is no longer available." };

  const raw: LineConfig = {
    pieces: formData.has("pieces") ? intField(formData, "pieces") : undefined,
    addOns: product.addOns.map((a) => ({ id: a.id, qty: intField(formData, `addon_${a.id}`) || 0 })),
  };
  const config = normalizeConfig(product, raw);
  if ("error" in config) return { status: "error", message: config.error };

  const limit = maxQuantity(product);
  if (limit <= 0) return { status: "error", message: "Sorry, this just sold out." };

  const cart = await readCart();
  // Stock is per product, so count every line of this product, whatever its options.
  const inCart = cart.filter((e) => e.productId === productId).reduce((n, e) => n + e.quantity, 0);
  const room = Math.max(0, limit - inCart);
  if (room === 0) return { status: "error", message: `You already have the most we can take for this item (${limit}).` };
  const add = Math.min(quantity, room);

  const key = lineKey(productId, config);
  const existing = cart.find((e) => lineKey(e.productId, e) === key);
  if (existing) existing.quantity += add;
  else cart.push({ productId, quantity: add, ...config });
  await writeCart(cart);

  return add < quantity
    ? { status: "added", message: `Added ${add}. That's the most we have for this item.` }
    : { status: "added", message: "Added to cart." };
}

/** Sets a line's quantity by its key; 0 removes it. Used by the cart's +/− and Remove buttons. */
export async function setCartQuantityAction(formData: FormData) {
  const key = String(formData.get("lineKey") ?? "");
  const quantity = intField(formData, "quantity");
  if (!Number.isFinite(quantity)) return;

  const cart = await readCart();
  const line = cart.find((e) => lineKey(e.productId, e) === key);
  if (!line) return;
  if (quantity <= 0) {
    await writeCart(cart.filter((e) => e !== line));
    return;
  }
  const [product] = await getProductsByIds([line.productId]).catch(() => []);
  const others = cart.filter((e) => e !== line && e.productId === line.productId).reduce((n, e) => n + e.quantity, 0);
  const limit = product ? Math.max(1, maxQuantity(product) - others) : quantity;
  line.quantity = Math.max(1, Math.min(quantity, limit));
  await writeCart(cart);
}
