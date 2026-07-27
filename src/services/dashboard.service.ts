import { apiFetch } from "../lib/api";
import { getWallets } from "./wallet.service";
import { getDebtStats } from "./debt.service";
import { getGoals } from "./goal.service";
import { getTransactions } from "./transaction.service";

export async function getDashboardData(owner?: string, searchParams: any = {}) {
  const period = searchParams?.month || new Date().toISOString().slice(0, 7);

  // Orchestrate calls to multiple modules
  // Note: In a production app, you might want a single "BFF" endpoint
  // but since we built modular Go services, we hit them accordingly.
  const params: any = { period };
  if (owner) params.owner = owner;
  if (searchParams?.startDate) params.startDate = searchParams.startDate;
  if (searchParams?.endDate) params.endDate = searchParams.endDate;

  const [summary, wallets, debtStats, goals, txResult] = await Promise.all([
    apiFetch<any>("/dashboard/summary", { params }),
    getWallets(owner),
    getDebtStats(owner || "ADAM"),
    getGoals(owner),
    getTransactions({ ...searchParams, limit: 5 })
  ]);

  // Adapt the data to the format expected by the frontend components
  return {
    period: { 
      start: new Date(period + "-01"), 
      end: new Date() // Simplified for now
    },
    summary: {
      income: summary.totalIncome,
      expense: summary.totalExpense,
      realIncome: summary.totalIncome, // Simplified mapping
      realExpense: summary.totalExpense,
      net: summary.net,
      avgDailyIncome: summary.totalIncome / 30, // Mocked avg
      avgDailyExpense: summary.totalExpense / 30
    },
    wallets,
    expenseByCategory: txResult.summary.expenseCategories,
    incomeByCategory: txResult.summary.incomeCategories,
    debtStats,
    goals,
    monthlyTrend: summary.monthlyTrend || [],
    dailyTrend: summary.dailyTrend || [],
    recentTransactions: txResult.transactions
  };
}

export async function getWalletAnalytics(walletId: string, searchParams: any) {
  const period = searchParams?.month || new Date().toISOString().slice(0, 7);
  const params: any = { period, walletId, owner: "ALL" };
  if (searchParams?.startDate) params.startDate = searchParams.startDate;
  if (searchParams?.endDate) params.endDate = searchParams.endDate;

  const [txResult, summaryResult] = await Promise.all([
    getTransactions({ ...searchParams, walletId, limit: 50, cache: "no-store" }),
    apiFetch<any>("/dashboard/summary", { params, cache: "no-store" })
  ]);
  
  return {
    summary: {
      income: summaryResult.totalIncome,
      expense: summaryResult.totalExpense,
      net: summaryResult.net,
      avgDailyIncome: summaryResult.totalIncome / 30,
      avgDailyExpense: summaryResult.totalExpense / 30
    },
    expenseByCategory: txResult.summary.expenseCategories,
    incomeByCategory: txResult.summary.incomeCategories,
    monthlyTrend: summaryResult.monthlyTrend || [],
    dailyTrend: summaryResult.dailyTrend || [],
    transactions: txResult.transactions
  };
}
