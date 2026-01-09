
export enum WalletType {
  BANK = "BANK",
  EWALLET = "EWALLET",
  CASH = "CASH",
  LIABILITY = "LIABILITY",
  INVESTMENT = "INVESTMENT",
}

export enum WalletOwner {
  ADAM = "ADAM",
  SASTI = "SASTI",
  JOINT = "JOINT",
}

export interface ILiabilityDetails {
  startDate: Date;
  tenorMonths: number;
}

export interface IBankDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface IWallet {
    _id: string; 
    name: string;
    type: WalletType;
    owner: WalletOwner;
    initialBalance: number;
    color?: string; // Hex or Preset Key
    liabilityDetails?: ILiabilityDetails;
    bankDetails?: IBankDetails;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    // Dynamic fields from aggregation
    currentBalance?: number; 
}
