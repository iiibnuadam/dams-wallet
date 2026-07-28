import { apiFetch } from "../lib/api";

export interface Transaction {
  _id: string;
  date: string;
  amount: number;
  description?: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  wallet: { _id: string; name: string };
  targetWallet?: { _id: string; name: string };
  category?: { _id: string; name: string };
  goalItem?: { _id: string; name: string; goal?: { _id: string; name: string } };
  createdBy: string;
  isDeleted: boolean;
  status: "PENDING" | "COMPLETED";
  isTransfer: boolean;
  createdAt: string;
}

export interface TransactionListResult {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    incomeCategories: any[];
    expenseCategories: any[];
  };
}

export async function createTransaction(data: any) {
  return apiFetch<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createBatchTransactions(data: any[]) {
  return apiFetch<{ inserted: number }>("/transactions/batch", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTransactions(params: any): Promise<TransactionListResult> {
  return apiFetch<TransactionListResult>("/transactions", {
    params,
  });
}

export async function updateTransaction(id: string, update: any) {
  return apiFetch<void>(`/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(update),
  });
}

export async function deleteTransaction(id: string) {
  return apiFetch<void>(`/transactions/${id}`, {
    method: "DELETE",
  });
}

export async function confirmTransaction(id: string) {
  return apiFetch<void>(`/transactions/${id}/confirm`, {
    method: "PATCH",
  });
}
