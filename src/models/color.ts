import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// No "server-only" or "@/" imports: scripts may load model files directly.

/** A shared color. Each product ticks which colors it offers for flowers and which for the wrapper. */
const colorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Swatch shown to buyers, e.g. "#e8a0bf". */
    hex: { type: String, required: true, match: /^#[0-9a-f]{6}$/i },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ColorDoc = InferSchemaType<typeof colorSchema>;

export const Color = registerModel("Color", colorSchema) as Model<ColorDoc>;
