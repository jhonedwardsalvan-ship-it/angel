import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// No "server-only" or "@/" imports (see CLAUDE.md, models are loaded by scripts).

import { ORDER_STATUSES } from "../lib/orders/status";

export { ORDER_STATUSES, ORDER_TRANSITIONS, type OrderStatus } from "../lib/orders/status";

const orderItemSchema = new Schema(
  {
    // Snapshot at purchase time: later product edits don't change past orders.
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    /** Options and their prices, e.g. [{ label: "20 flowers", amount: 1000 }, { label: "Glitter on 10 flowers", amount: 100 }]. */
    breakdown: { type: [new Schema({ label: String, amount: Number }, { _id: false })], default: [] },
    /** No stock was taken for this item, so cancelling doesn't put any back. */
    madeToOrder: { type: Boolean, default: false },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    /** Better Auth user id, when the customer was signed in. */
    userId: { type: String, default: null },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true },
    },
    delivery: {
      recipientName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      /** YYYY-MM-DD in the store's timezone. */
      date: { type: String, required: true },
      slot: { type: String, enum: ["morning", "afternoon", "evening"], required: true },
    },
    cardMessage: { type: String, default: "" },
    /** Set by an admin when the order goes out for delivery. */
    tracking: {
      courier: { type: String, default: "" },
      /** Courier's live tracking link (Lalamove, Grab, J&T…), shown to the buyer. */
      url: { type: String, default: "" },
    },
    payment: {
      // "arranged": no payment on the site; the team contacts the buyer. Others are older orders.
      method: { type: String, enum: ["arranged", "demo-card", "cod"], required: true },
      status: { type: String, enum: ["demo", "unpaid", "paid"], required: true },
    },
    items: {
      type: [orderItemSchema],
      validate: { validator: (v: unknown[]) => v.length > 0, message: "An order needs items" },
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    statusHistory: {
      type: [
        new Schema(
          {
            status: { type: String, enum: ORDER_STATUSES, required: true },
            at: { type: Date, required: true },
            /** Admin user id, or null for the customer placing the order. */
            by: { type: String, default: null },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ "customer.email": 1 });
orderSchema.index({ createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const Order = registerModel("Order", orderSchema) as Model<OrderDoc>;
