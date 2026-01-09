import mongoose, { Schema, Document, Model } from "mongoose";
import { WalletType, WalletOwner, IWallet as IWalletBase } from "@/types/wallet";

// Re-export for convenience if needed, or just use from types
export { WalletType, WalletOwner };

export interface IWalletDocument extends Omit<IWalletBase, "_id">, Document {}

const WalletSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(WalletType), required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    initialBalance: { type: Number, required: true, default: 0 },
    color: { type: String, default: "BLUE" },
    liabilityDetails: {
      startDate: { type: Date },
      tenorMonths: { type: Number },
    },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolder: { type: String },
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.Wallet) {
  delete mongoose.models.Wallet;
}

const Wallet: Model<IWalletDocument> = mongoose.models.Wallet || mongoose.model<IWalletDocument>("Wallet", WalletSchema);

export default Wallet;
