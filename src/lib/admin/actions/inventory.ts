"use server";

import { revalidatePath } from "next/cache";
import { adjustStock, setStock } from "@/lib/inventory";
import { requireAdmin } from "@/lib/session";
import type { AdminFormState } from "@/types/admin";
import { text, wholeNumber } from "../form";

const MAX_STOCK = 100_000;

/** "Set to" an absolute value, or "adjust by" a signed delta that can't take stock below 0. */
export async function updateStockAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const session = await requireAdmin();
  const productId = text(formData, "productId", 24);
  const mode = text(formData, "mode", 10) === "set" ? "set" : "adjust";
  const amount = wholeNumber(formData, "amount");
  const note = text(formData, "note", 200);
  const values = { amount: text(formData, "amount", 20), note, mode };

  if (!Number.isFinite(amount) || (mode === "set" && amount < 0) || Math.abs(amount) > MAX_STOCK) {
    return { fieldErrors: { amount: mode === "set" ? "Enter a whole number, 0 or more." : "Enter a whole number like 5 or -2." }, values };
  }
  if (mode === "adjust" && amount === 0) return { fieldErrors: { amount: "Enter a change other than 0." }, values };

  const actor = { actorId: session.user.id, note };
  const result =
    mode === "set"
      ? await setStock(productId, amount, actor)
      : await adjustStock(productId, amount, "admin_adjust", actor);

  if (result === null) {
    return {
      error: mode === "set" ? "Product not found." : "That would take stock below 0. Refresh to see the current count.",
      values,
    };
  }
  revalidatePath("/admin", "layout");
  return { notice: `Stock is now ${result}.` };
}
