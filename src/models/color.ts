import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// No "server-only" or "@/" imports: scripts may load model files directly.

/** A shared color, usable for flowers, wrappers or both. Buyers pick 1–2 of each kind a product offers. */
const colorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Swatch shown to buyers, e.g. "#e8a0bf". */
    hex: { type: String, required: true, match: /^#[0-9a-f]{6}$/i },
    /** Offered as a flower color and/or a wrapper color (at least one). */
    forFlowers: { type: Boolean, default: true },
    forWrappers: { type: Boolean, default: false },
    /** "all": offered on every product. "selected": only on products that tick it (Product.colorIds). */
    appliesTo: { type: String, enum: ["all", "selected"], default: "selected" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ColorDoc = InferSchemaType<typeof colorSchema>;

export const Color = registerModel("Color", colorSchema) as Model<ColorDoc>;
