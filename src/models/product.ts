import { Schema, type InferSchemaType, type Model, type Types } from "mongoose";
import { registerModel } from "./register";
import { imageSchema } from "./category";

const wholeNumber = {
  validator: Number.isInteger,
  message: "{PATH} must be a whole number",
};

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", trim: true },
    details: { type: [String], default: [] },
    /** "per_piece": the buyer picks how many flowers; price is per flower. */
    pricing: { type: String, enum: ["fixed", "per_piece"], default: "fixed" },
    /** Whole pesos, per item (fixed) or per flower (per_piece). */
    price: { type: Number, required: true, min: 0, validate: wholeNumber },
    /** Fewest flowers in a per_piece bouquet. */
    minPieces: { type: Number, default: 5, min: 1, validate: wholeNumber },
    /** No stock limit (per_piece products are always made to order). */
    madeToOrder: { type: Boolean, default: false },
    /** Shared add-ons ticked for this product (add-ons set to "all products" apply anyway). */
    addOnIds: { type: [{ type: Schema.Types.ObjectId, ref: "AddOn" }], default: [] },
    /** Shared colors buyers can pick for the flowers / the wrapper (1–2 of each). */
    flowerColorIds: { type: [{ type: Schema.Types.ObjectId, ref: "Color" }], default: [] },
    wrapperColorIds: { type: [{ type: Schema.Types.ObjectId, ref: "Color" }], default: [] },
    compareAtPrice: {
      type: Number,
      min: 0,
      validate: [
        wholeNumber,
        {
          validator(this: { price: number }, value: number) {
            return value > this.price;
          },
          message: "compareAtPrice must be greater than price",
        },
      ],
    },
    /** First image is the primary one shown on cards. */
    images: {
      type: [imageSchema],
      validate: {
        validator: (v: unknown[]) => v.length > 0,
        message: "A product needs at least one image",
      },
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    stock: { type: Number, default: 0, min: 0, validate: wholeNumber },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isNewArrival: 1, createdAt: -1 });
productSchema.index({ stock: 1, isActive: 1 });

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const Product = registerModel("Product", productSchema) as Model<ProductDoc>;

/**
 * Flower and wrapper color ids of a lean product row. Products saved before the
 * two lists existed have one legacy "colorIds" list, offered for both.
 */
export function productColorIds(row: Pick<ProductDoc, "flowerColorIds" | "wrapperColorIds">) {
  const legacy = (row as { colorIds?: Types.ObjectId[] }).colorIds ?? [];
  const old = row.flowerColorIds === undefined && row.wrapperColorIds === undefined;
  return { flower: old ? legacy : (row.flowerColorIds ?? []), wrapper: old ? legacy : (row.wrapperColorIds ?? []) };
}
