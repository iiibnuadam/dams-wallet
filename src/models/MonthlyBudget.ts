import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnvelope {
  groupName: string;       // matches Category.group (e.g. "Food", "Housing")
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
  limit: number;
}

export interface IMonthlyBudget extends Document {
  user: mongoose.Types.ObjectId;
  period: string; // Format "YYYY-MM"
  envelopes: IEnvelope[];
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
    envelopes: [
      {
        groupName: { type: String, required: true },
        type: { type: String, enum: ["NEEDS", "WANTS", "SAVINGS"], default: "NEEDS" },
        icon: { type: String, default: "📁" },
        color: { type: String, default: "#6b7280" },
        limit: { type: Number, default: 0 },
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
