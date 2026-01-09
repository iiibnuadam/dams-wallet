import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoal extends Document {
  name: string;
  owner: string;
  targetDate: Date;
  visibility: "PRIVATE" | "SHARED";
  sharedWith: string[]; // Array of usernames
  color?: string;
  icon?: string;
  groups?: { name: string; color?: string; icon?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetDate: { type: Date, required: true },
    visibility: { type: String, enum: ["PRIVATE", "SHARED"], default: "SHARED" },
    sharedWith: { type: [String], default: [] },
    color: { type: String, default: "#4f46e5" }, // Default indigo-600
    icon: { type: String, default: "🎯" },
    groups: [{
        name: { type: String, required: true },
        color: { type: String },
        icon: { type: String }
    }],
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.Goal) {
  delete mongoose.models.Goal;
}

const Goal: Model<IGoal> = mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);

export default Goal;
