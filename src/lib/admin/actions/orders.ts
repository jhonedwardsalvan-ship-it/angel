"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { releaseStock } from "@/lib/inventory";
import { requireAdmin } from "@/lib/session";
import { isCourier, isValidTrackingUrl } from "@/lib/orders/couriers";
import { ORDER_STATUSES, ORDER_TRANSITIONS, type OrderStatus } from "@/lib/orders/status";
import { Order } from "@/models/order";
import { text } from "../form";

/** Courier + optional tracking link from the "out for delivery" form. */
function readTracking(formData: FormData): { courier: string; url: string } | { error: string } {
  const courier = text(formData, "courier", 30);
  const url = text(formData, "trackingUrl", 500);
  if (courier && !isCourier(courier)) return { error: "Choose a courier from the list." };
  if (url && !isValidTrackingUrl(url)) return { error: "The tracking link must be a full https:// link from the courier." };
  return { courier, url };
}

/**
 * Moves an order to an allowed next status. The update is conditional on the
 * current status, so two admins can't both apply a transition (e.g. cancel
 * twice and restock twice). Cancelling puts the items back in stock.
 */
export async function updateOrderStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const id = text(formData, "id", 24);
  const from = text(formData, "from", 30) as OrderStatus;
  const to = text(formData, "to", 30) as OrderStatus;
  if (!ORDER_STATUSES.includes(from) || !ORDER_TRANSITIONS[from].includes(to)) return;

  // Payment first: leaving "pending" for "preparing" records the payment in the same update.
  const set: Record<string, unknown> = { status: to };
  if (from === "pending" && to === "preparing") set["payment.status"] = "paid";
  if (to === "out_for_delivery") {
    const tracking = readTracking(formData);
    if ("error" in tracking) redirect(`/admin/orders/${id}?error=${encodeURIComponent(tracking.error)}`);
    set["tracking.courier"] = tracking.courier;
    set["tracking.url"] = tracking.url;
  }

  await connectDB();
  const order = await Order.findOneAndUpdate(
    { _id: id, status: from },
    { $set: set, $push: { statusHistory: { status: to, at: new Date(), by: session.user.id } } },
    { new: true },
  );
  if (order && to === "cancelled") {
    await releaseStock(
      order.items.filter((i) => !i.madeToOrder).map((i) => ({ productId: i.product.toString(), quantity: i.quantity })),
      order._id,
      session.user.id,
    );
  }
  revalidatePath("/admin", "layout");
}

/** Adds or fixes the courier and tracking link after the order is out for delivery. */
export async function updateTrackingAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 24);
  const tracking = readTracking(formData);
  if ("error" in tracking) redirect(`/admin/orders/${id}?error=${encodeURIComponent(tracking.error)}`);

  await connectDB();
  await Order.updateOne(
    { _id: id, status: { $in: ["out_for_delivery", "delivered"] } },
    { $set: { "tracking.courier": tracking.courier, "tracking.url": tracking.url } },
  );
  redirect(`/admin/orders/${id}?notice=${encodeURIComponent("Tracking link saved.")}`);
}
