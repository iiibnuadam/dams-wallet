import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudgetItem extends Document {
  name: string;
  groupName?: string;
  plannedAmount: number;
  isDeleted: boolean;
}

const BudgetItemSchema: Schema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    itemName: { type: String, required: true },
    groupName: { type: String },
    plannedAmount: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BudgetItem: Model<IBudgetItem> = mongoose.models.BudgetItem || mongoose.model<IBudgetItem>("BudgetItem", BudgetItemSchema);

export default BudgetItem;
