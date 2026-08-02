import { apiFetch } from "../lib/api";

// "" (OWNER_ALL) = spend combined across everyone; "ADAM"/"SASTI" = that
// person's wallets only.
export type EnvelopeOwner = "" | "ADAM" | "SASTI";
export const OWNER_ALL: EnvelopeOwner = "";

export type EnvelopeFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "ANNUAL";

export interface EnvelopeItem {
  categoryId: string;
  owner: EnvelopeOwner;
}

export interface Envelope {
  name: string;
  type: EnvelopeFrequency;
  items: EnvelopeItem[];
  icon: string;
  color: string;
  limit: number;
}

export interface CategorySpend {
  id: string;
  name: string;
  icon: string;
  color: string;
  owner?: EnvelopeOwner;
  spent: number;
}

export interface EnvelopeOverview extends Envelope {
  spent: number;
  remaining: number;
  percent: number;
  safeToSpendToday: number;
  // Purely informational: what the (always month-scoped) limit works out
  // to in this envelope's own Type unit, e.g. pacingUnit="day",
  // pacingAmount=30000 for a Daily-paced coffee budget. Doesn't affect
  // spent/remaining/percent -- budgeting stays monthly regardless of Type.
  pacingUnit?: "day" | "week" | "year" | "";
  pacingAmount?: number;
  categories: CategorySpend[];
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

  async upsertEnvelopes(period: string, envelopes: Envelope[], income: number = 0) {
    return apiFetch<{ success: boolean }>("/budget/envelopes", {
      method: "PUT",
      body: JSON.stringify({ period, envelopes, income }),
    });
  },

  async getBudgetOverview(period: string): Promise<BudgetOverview> {
    return apiFetch<BudgetOverview>("/budget/overview", {
      params: { period },
    });
  },
};
