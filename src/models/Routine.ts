import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoutine extends Document {
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  wallet: mongoose.Types.ObjectId;
  targetWallet?: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  startDate: Date;
  nextRun: Date;
  lastRun?: Date;
  status: "ACTIVE" | "PAUSED";
  owner: string; // "ADAM"Or "SASTI"
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema: Schema = new Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["INCOME", "EXPENSE", "TRANSFER"], required: true },
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    targetWallet: { type: Schema.Types.ObjectId, ref: "Wallet" },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    frequency: { type: String, enum: ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"], required: true },
    startDate: { type: Date, required: true },
    nextRun: { type: Date, required: true },
    lastRun: { type: Date },
    status: { type: String, enum: ["ACTIVE", "PAUSED"], default: "ACTIVE" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.Routine) {
    delete mongoose.models.Routine;
}

const Routine: Model<IRoutine> = mongoose.models.Routine || mongoose.model<IRoutine>("Routine", RoutineSchema);

export default Routine;
