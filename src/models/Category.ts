import mongoose, { Schema, Document, Model } from "mongoose";
import { CategoryType, ICategory as ICategoryBase } from "@/types/category";

export { CategoryType }; // Re-export for convenience if needed by SERVER files

export interface ICategoryDocument extends Omit<ICategoryBase, "_id">, Document {}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(CategoryType), required: true },
    flexibility: { type: String, enum: ["FIXED", "VARIABLE"], default: "VARIABLE" },
    icon: { type: String }, // Lucide icon name or Emoji
    color: { type: String }, // Hex or Tailwind class
    group: { type: String }, // Grouping like "Housing", "Transport"
    bucket: { type: String, enum: ["NEEDS", "WANTS", "SAVINGS"] }, // 50/30/20 Rule
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Category: Model<ICategoryDocument> = mongoose.models.Category || mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;
