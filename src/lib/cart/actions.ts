"use server";

import { getProductsByIds } from "@/lib/catalog/queries";
import { readCart, writeCart } from "./cart-cookie";
import { MAX_QUANTITY_PER_LINE } from "./pricing";

export type AddToCartState = { status: "added" | "error"; message: string } | undefined;

function intField(formData: FormData, key: string) {
  const n = Number(formData.get(key));
  return Number.isInteger(n) ? n : NaN;
}

export async function addToCartAction(_prev: AddToCartState, formData: FormData): Promise<AddToCartState> {
  const productId = String(formData.get("productId") ?? "");
  const quantity = intField(formData, "quantity");
  if (!(quantity >= 1)) return { status: "error", message: "Choose a quantity." };

  const [product] = await getProductsByIds([productId]).catch(() => []);
  if (!product) return { status: "error", message: "This product is no longer available." };
  if (product.stock <= 0) return { status: "error", message: "Sorry, this just sold out." };

  const cart = await readCart();
  const existing = cart.find((e) => e.productId === productId);
  const limit = Math.min(product.stock, MAX_QUANTITY_PER_LINE);
  const wanted = (existing?.quantity ?? 0) + quantity;
  const next = Math.min(wanted, limit);

  if (existing) existing.quantity = next;
  else cart.push({ productId, quantity: next });
  await writeCart(cart);

  return next < wanted
    ? { status: "added", message: `Added — your cart now has the maximum of ${next} for this item.` }
    : { status: "added", message: `Added to cart.` };
}

/** Sets a line's quantity; 0 removes it. Used by the +/− and Remove buttons. */
export async function setCartQuantityAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const quantity = intField(formData, "quantity");
  if (!Number.isFinite(quantity)) return;

  const cart = await readCart();
  if (quantity <= 0) {
    await writeCart(cart.filter((e) => e.productId !== productId));
    return;
  }
  const [product] = await getProductsByIds([productId]).catch(() => []);
  const limit = Math.min(product?.stock ?? quantity, MAX_QUANTITY_PER_LINE);
  await writeCart(
    cart.map((e) => (e.productId === productId ? { ...e, quantity: Math.max(1, Math.min(quantity, limit)) } : e)),
  );
}
