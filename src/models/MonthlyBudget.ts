import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudgetItemSub {
  name: string;
  limit: number;
  trackingType: "DAILY" | "WEEKLY" | "MONTHLY";
  categories: mongoose.Types.ObjectId[];
}

export interface IBudgetGroupItem {
  name: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
  items: IBudgetItemSub[];
  targetGroup?: string; // For auto-sync/simple mode
}

export interface IMonthlyBudget extends Document {
  user: mongoose.Types.ObjectId;
  period: string; // Format "YYYY-MM"
  groups: IBudgetGroupItem[];
  income: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyBudgetSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    period: { type: String, required: true },
    income: { type: Number, default: 0 },
    groups: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ["NEEDS", "WANTS", "SAVINGS"], default: "NEEDS" },
        icon: { type: String, default: "CircleDollarSign" },
        color: { type: String, default: "#3b82f6" }, 
        // Simple/Leaf Mode Fields
        limit: { type: Number, default: 0 },
        trackingType: {
            type: String,
            enum: ["DAILY", "WEEKLY", "MONTHLY"],
            default: "MONTHLY",
        },
        targetGroup: { type: String }, // NEW: Matches Category.group
        categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
        // Nested Mode Fields
        items: [
            {
                name: { type: String, required: true },
                limit: { type: Number, required: true, min: 0 },
                trackingType: {
                    type: String,
                    enum: ["DAILY", "WEEKLY", "MONTHLY"],
                    default: "MONTHLY",
                },
                categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
            }
        ]
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MonthlyBudgetSchema.index({ user: 1, period: 1 }, { unique: true });

const MonthlyBudget: Model<IMonthlyBudget> =
  mongoose.models.MonthlyBudget ||
  mongoose.model<IMonthlyBudget>("MonthlyBudget", MonthlyBudgetSchema);

export default MonthlyBudget;
