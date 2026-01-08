import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDebt extends Document {
  type: "LENT" | "BORROWED"; // LENT = Piutang (You gave money), BORROWED = Utang (You received money)
  person: string; // Name of the person
  amount: number;
  description: string;
  loanDate: Date;
  dueDate?: Date;
  status: "ACTIVE" | "PAID";
  proofUrl?: string; // URL from Vercel Blob
  notes?: string;
  owner: string; // "ADAM" or "SASTI"
  createdAt: Date;
  updatedAt: Date;
}

const DebtSchema: Schema = new Schema(
  {
    type: { type: String, enum: ["LENT", "BORROWED"], required: true },
    person: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    loanDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    status: { type: String, enum: ["ACTIVE", "PAID"], default: "ACTIVE" },
    proofUrl: { type: String },
    notes: { type: String },
    owner: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent overwrite in dev
if (process.env.NODE_ENV === "development" && mongoose.models.Debt) {
    delete mongoose.models.Debt;
}

const Debt: Model<IDebt> = mongoose.models.Debt || mongoose.model<IDebt>("Debt", DebtSchema);

export default Debt;
