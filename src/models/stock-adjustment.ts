import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// Append-only history of every stock change.

export const STOCK_REASONS = ["admin_set", "admin_adjust", "order", "order_cancelled"] as const;
export type StockReason = (typeof STOCK_REASONS)[number];

const stockAdjustmentSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    delta: { type: Number, required: true },
    before: { type: Number, required: true },
    after: { type: Number, required: true },
    reason: { type: String, enum: STOCK_REASONS, required: true },
    note: { type: String, default: "" },
    /** Admin user id; null for customer orders. */
    actorId: { type: String, default: null },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

stockAdjustmentSchema.index({ product: 1, createdAt: -1 });
stockAdjustmentSchema.index({ createdAt: -1 });

export type StockAdjustmentDoc = InferSchemaType<typeof stockAdjustmentSchema>;

export const StockAdjustment = registerModel("StockAdjustment", stockAdjustmentSchema) as Model<StockAdjustmentDoc>;
