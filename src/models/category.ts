import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// No "server-only" or "@/" imports: scripts/seed.ts loads this file directly.

export const imageSchema = new Schema(
  {
    src: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: imageSchema, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    /** Listed in the store's top menu after "New Arrivals", in sortOrder. */
    showInMenu: { type: Boolean, default: false },
  },
  { timestamps: true },
);

categorySchema.index({ sortOrder: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const Category = registerModel("Category", categorySchema) as Model<CategoryDoc>;
