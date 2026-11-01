import { Schema, type InferSchemaType, type Model } from "mongoose";
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
    /** Whole pesos. */
    price: { type: Number, required: true, min: 0, validate: wholeNumber },
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
