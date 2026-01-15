import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoalItem extends Document {
  goalId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  groupName?: string;
  name: string;
  estimatedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalItemSchema: Schema = new Schema(
  {
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
    groupId: { type: Schema.Types.ObjectId },
    groupName: { type: String }, // Deprecated in favor of groupId, kept for legacy
    name: { type: String, required: true },
    estimatedAmount: { type: Number, required: true },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.GoalItem) {
  delete mongoose.models.GoalItem;
}

const GoalItem: Model<IGoalItem> = mongoose.models.GoalItem || mongoose.model<IGoalItem>("GoalItem", GoalItemSchema);

export default GoalItem;
