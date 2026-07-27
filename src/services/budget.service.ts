import { apiFetch } from "../lib/api";

export interface Envelope {
  name: string;
  categoryIds: string[];
  icon: string;
  color: string;
  limit: number;
}

export interface EnvelopeOverview extends Envelope {
  spent: number;
  remaining: number;
  percent: number;
  safeToSpendToday: number;
}

export interface BudgetOverview {
  period: string;
  income: number;
  realizedIncome: number;
  envelopes: EnvelopeOverview[];
  unbudgetedSpent: number;
  totalBudget: number;
  totalSpent: number;
  totalNeeds: number;
  totalWants: number;
  daysRemaining: number;
}

export interface AvailableGroup {
  groupName: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
}

export const BudgetService = {
  async getAvailableGroups(): Promise<AvailableGroup[]> {
    return apiFetch<AvailableGroup[]>("/budget/available-groups");
  },

  async upsertEnvelopes(userId: string, period: string, envelopes: Envelope[], income: number = 0) {
    return apiFetch<any>("/budget/envelopes", {
      method: "PUT",
      body: JSON.stringify({ userId, period, envelopes, income }),
    });
  },

  async syncNewCategoryGroup(userId: string, category: any) {
    // This is handled by the backend's getBudgetOverview (auto-copy/creation)
    // or specifically when creating/updating envelopes if needed.
    // For now, let's keep it as is or hit a minor sync endpoint if we add it.
    // Since the logic is now central in BE, FE just hits overview and BE handles logic.
    return Promise.resolve();
  },

  async getBudgetOverview(userId: string, period: string): Promise<BudgetOverview> {
    return apiFetch<BudgetOverview>("/budget/overview", {
      params: { period },
    });
  },
};
