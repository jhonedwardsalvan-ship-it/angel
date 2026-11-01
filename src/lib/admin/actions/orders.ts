"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { releaseStock } from "@/lib/inventory";
import { requireAdmin } from "@/lib/session";
import { ORDER_STATUSES, ORDER_TRANSITIONS, type OrderStatus } from "@/lib/orders/status";
import { Order } from "@/models/order";
import { text } from "../form";

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

  await connectDB();
  const order = await Order.findOneAndUpdate(
    { _id: id, status: from },
    { $set: { status: to }, $push: { statusHistory: { status: to, at: new Date(), by: session.user.id } } },
    { new: true },
  );
  if (order && to === "cancelled") {
    await releaseStock(
      order.items.map((i) => ({ productId: i.product.toString(), quantity: i.quantity })),
      order._id,
      session.user.id,
    );
  }
  revalidatePath("/admin", "layout");
}
