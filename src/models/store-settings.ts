import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// No "server-only" or "@/" imports: scripts may load this file directly.

export const HIGHLIGHT_ICONS = ["truck", "card", "leaf", "shield"] as const;

const highlightSchema = new Schema(
  {
    icon: { type: String, enum: HIGHLIGHT_ICONS, required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", trim: true },
  },
  { _id: false },
);

/** Single document (key "store") holding store-wide settings edited in the admin. */
const storeSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "store" },
    deliveryFee: { type: Number, required: true, min: 0 },
    /** Orders at or above this subtotal deliver free. 0 turns free delivery off. */
    freeDeliveryMin: { type: Number, required: true, min: 0 },
    /** Earliest delivery date is this many days after today (no rush orders). */
    leadDays: { type: Number, default: 3, min: 1 },
    productHighlights: { type: [highlightSchema], default: [] },
  },
  { timestamps: true },
);

export type StoreSettingsDoc = InferSchemaType<typeof storeSettingsSchema>;

export const StoreSettings = registerModel("StoreSettings", storeSettingsSchema) as Model<StoreSettingsDoc>;
