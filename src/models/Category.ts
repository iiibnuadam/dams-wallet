import mongoose, { Schema, Document, Model } from "mongoose";

export enum CategoryType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
}

export interface ICategory extends Document {
  name: string;
  type: CategoryType;
  flexibility: "FIXED" | "VARIABLE";
  isDeleted: boolean;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(CategoryType), required: true },
    flexibility: { type: String, enum: ["FIXED", "VARIABLE"], default: "VARIABLE" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
