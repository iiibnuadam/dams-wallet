import { apiFetch } from "../lib/api";

export interface Wallet {
  _id: string;
  name: string;
  type: string;
  owner: string;
  ownerName: string;
  initialBalance: number;
  currentBalance: number;
  color: string;
  liabilityDetails?: {
    startDate?: string;
    tenorMonths?: number;
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getWallets(owner?: string) {
  return apiFetch<Wallet[]>("/wallets", {
    params: { owner },
  });
}

export async function getWalletById(id: string) {
  return apiFetch<Wallet>(`/wallets/${id}`);
}

export async function getNetWorth() {
  const wallets = await getWallets();
  return wallets.reduce((sum, w) => sum + (w.currentBalance || 0), 0);
}

// Note: dashboard/summary endpoint is preferred for global summary, 
// but keeping this for compatibility if used specifically.

export async function createWallet(data: Partial<Wallet>) {
  return apiFetch<Wallet>("/wallets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateWallet(id: string, data: Partial<Wallet>) {
  return apiFetch<Wallet>(`/wallets/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteWallet(id: string) {
  return apiFetch<void>(`/wallets/${id}`, {
    method: "DELETE",
  });
}
