import mongoose, { Schema, Document, Model } from "mongoose";

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
}

export enum PaymentPhase {
  DP = "DP",
  FULL = "FULL",
  TERMINAL = "TERMINAL",
}

export interface ITransaction extends Document {
  date: Date;
  amount: number;
  description?: string;
  type: TransactionType;
  wallet: mongoose.Types.ObjectId;
  targetWallet?: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  budgetItem?: mongoose.Types.ObjectId;
  paymentPhase?: PaymentPhase;
  partnerOwed?: number;
  adminFee?: number;
  createdBy: string;
  isDeleted: boolean;
  status: "PENDING" | "COMPLETED";
  routineId?: mongoose.Types.ObjectId;
  relatedTransactionId?: mongoose.Types.ObjectId;
  isTransfer?: boolean;
}

const TransactionSchema: Schema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true },
    description: { type: String },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    targetWallet: { type: Schema.Types.ObjectId, ref: "Wallet" },
    category: { type: Schema.Types.ObjectId, ref: "Category" }, 
    
    // Project Fields
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    budgetItem: { type: Schema.Types.ObjectId, ref: "BudgetItem" },
    paymentPhase: { type: String, enum: Object.values(PaymentPhase) },

    // Split Fields
    partnerOwed: { type: Number },
    adminFee: { type: Number, default: 0 },
    
    // Meta
    createdBy: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    
    // Routine Integration
    status: { type: String, enum: ["PENDING", "COMPLETED"], default: "COMPLETED" },
    routineId: { type: Schema.Types.ObjectId, ref: "Routine" },
    relatedTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    isTransfer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
