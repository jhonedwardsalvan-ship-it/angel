"use server";

import { redirect } from "next/navigation";
import { matchGuestOrder, normalizeOrderNumber } from "./queries";
import { allowTrackedOrder } from "./tracking";

export type TrackOrderState =
  | { error?: string; values?: { number: string; phone: string } }
  | undefined;

/** Guest lookup: order number + the phone used at checkout. Same message for every miss. */
export async function trackOrderAction(_prev: TrackOrderState, formData: FormData): Promise<TrackOrderState> {
  const number = normalizeOrderNumber(String(formData.get("number") ?? "").slice(0, 40));
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 30);
  const values = { number, phone };

  if (!number || !phone) return { error: "Enter your order number and phone number.", values };
  if (!(await matchGuestOrder(number, phone))) {
    return { error: "We couldn't find an order with that number and phone. Check both and try again.", values };
  }

  await allowTrackedOrder(number);
  redirect(`/orders/${encodeURIComponent(number)}`);
}
