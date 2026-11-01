import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// No "server-only" or "@/" imports: scripts may load model files directly.

/** A shared extra (glitter, lights, gift card) priced per piece; the buyer picks how many. */
const addOnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Whole pesos per piece. */
    price: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger, message: "{PATH} must be a whole number" } },
    /** "all": offered on every product. "selected": only on products that tick it (Product.addOnIds). */
    appliesTo: { type: String, enum: ["all", "selected"], default: "selected" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type AddOnDoc = InferSchemaType<typeof addOnSchema>;

export const AddOn = registerModel("AddOn", addOnSchema) as Model<AddOnDoc>;
