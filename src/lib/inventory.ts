import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/models/product";
import { StockAdjustment, type StockReason } from "@/models/stock-adjustment";

// The only place that changes product stock. Every change is a single atomic
// update guarded so stock can't go below zero, followed by a history entry.
// Transactions aren't available on a standalone mongod, so multi-product
// changes roll back by hand.

type Actor = { actorId?: string | null; note?: string; orderId?: Types.ObjectId | null };

async function log(productId: string | Types.ObjectId, before: number, after: number, reason: StockReason, actor: Actor) {
  await StockAdjustment.create({
    product: productId,
    delta: after - before,
    before,
    after,
    reason,
    note: actor.note ?? "",
    actorId: actor.actorId ?? null,
    order: actor.orderId ?? null,
  });
}

/** Adds `delta` (may be negative). Returns the new stock, or null if it would go below zero. */
export async function adjustStock(productId: string, delta: number, reason: StockReason, actor: Actor = {}) {
  await connectDB();
  const before = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: Math.max(0, -delta) } },
    { $inc: { stock: delta } },
    { new: false, projection: { stock: 1 } },
  ).lean();
  if (!before) return null;
  await log(productId, before.stock, before.stock + delta, reason, actor);
  return before.stock + delta;
}

/** Sets stock to an absolute value. Returns the new stock, or null if the product doesn't exist. */
export async function setStock(productId: string, stock: number, actor: Actor = {}) {
  await connectDB();
  const before = await Product.findOneAndUpdate(
    { _id: productId },
    { $set: { stock } },
    { new: false, projection: { stock: 1 } },
  ).lean();
  if (!before) return null;
  if (before.stock !== stock) await log(productId, before.stock, stock, "admin_set", actor);
  return stock;
}

export type StockLine = { productId: string; quantity: number };

/**
 * Takes stock for every line, or none: if any line can't be fulfilled the
 * lines already taken are put back. Returns the id of the failing product.
 */
export async function reserveStock(lines: StockLine[], orderId: Types.ObjectId) {
  const taken: StockLine[] = [];
  for (const line of lines) {
    const after = await adjustStock(line.productId, -line.quantity, "order", { orderId });
    if (after === null) {
      await releaseStock(taken, orderId);
      return { ok: false as const, productId: line.productId };
    }
    taken.push(line);
  }
  return { ok: true as const };
}

/** Puts stock back, e.g. on a failed checkout or a cancelled order. */
export async function releaseStock(lines: StockLine[], orderId: Types.ObjectId, actorId: string | null = null) {
  for (const line of lines) {
    await adjustStock(line.productId, line.quantity, "order_cancelled", { orderId, actorId });
  }
}
