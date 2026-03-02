import MonthlyBudget, { IMonthlyBudget, IEnvelope } from "@/models/MonthlyBudget";
import Transaction from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import dbConnect from "@/lib/db";
import { startOfMonth, endOfMonth, parseISO, differenceInCalendarDays } from "date-fns";

export interface EnvelopeOverview {
  groupName: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
  safeToSpendToday: number;
  categoryIds: string[];  // all category IDs belonging to this group
}

export interface BudgetOverview {
  period: string;
  income: number;
  realizedIncome: number;
  envelopes: EnvelopeOverview[];
  unbudgetedSpent: number;   // spending not covered by any envelope
  totalBudget: number;
  totalSpent: number;
  daysRemaining: number;
}

export interface AvailableGroup {
  groupName: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
}

export const BudgetService = {
  /**
   * Get all unique category groups from the Category collection.
   * Used to populate "which groups can I create envelopes for".
   */
  async getAvailableGroups(): Promise<AvailableGroup[]> {
    await dbConnect();
    const { default: Category } = await import("@/models/Category");
    const cats = await Category.find({ isDeleted: false, type: "EXPENSE", group: { $exists: true, $ne: "" } })
      .select("group bucket icon color")
      .lean();

    // Deduplicate by group name, keeping first occurrence's icon/color
    const seen = new Map<string, AvailableGroup>();
    for (const cat of cats as any[]) {
      if (!cat.group || seen.has(cat.group)) continue;
      seen.set(cat.group, {
        groupName: cat.group,
        type: (cat.bucket as "NEEDS" | "WANTS" | "SAVINGS") || "NEEDS",
        icon: cat.icon || "📁",
        color: cat.color || "#6b7280",
      });
    }

    // Sort: NEEDS first, then WANTS, then alphabetical within each bucket
    return Array.from(seen.values()).sort((a, b) => {
      const bucketOrder = { NEEDS: 0, WANTS: 1, SAVINGS: 2 };
      const diff = bucketOrder[a.type] - bucketOrder[b.type];
      if (diff !== 0) return diff;
      return a.groupName.localeCompare(b.groupName);
    });
  },

  /**
   * Upsert envelope limits for a given period.
   */
  async upsertEnvelopes(userId: string, period: string, envelopes: IEnvelope[], income: number = 0) {
    await dbConnect();
    const budget = await MonthlyBudget.findOneAndUpdate(
      { user: userId, period },
      { user: userId, period, income, envelopes, isDeleted: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return budget;
  },

  /**
   * When a new category is created, ensure its group has an envelope in the
   * current month's budget. If the group is already budgeted, this is a no-op.
   */
  async syncNewCategoryGroup(userId: string, category: any) {
    if (!category?.group) return; // No group → nothing to sync

    await dbConnect();
    const period = new Date().toISOString().slice(0, 7); // e.g. "2026-03"

    const budget = await MonthlyBudget.findOne({ user: userId, period, isDeleted: false });

    // If this group already has an envelope, skip
    if (budget?.envelopes?.some((e: any) => e.groupName === category.group)) return;

    const newEnvelope: IEnvelope = {
      groupName: category.group,
      type: (category.bucket as "NEEDS" | "WANTS" | "SAVINGS") || "NEEDS",
      icon: category.icon || "📁",
      color: category.color || "#6b7280",
      limit: 0,
    };

    if (budget) {
      budget.envelopes.push(newEnvelope);
      await budget.save();
    } else {
      await MonthlyBudget.create({
        user: userId,
        period,
        income: 0,
        envelopes: [newEnvelope],
        isDeleted: false,
      });
    }
  },

  /**
   * Get full budget overview for a given month.
   * Auto-copies envelopes from last month if none exist for this period.
   */
  async getBudgetOverview(userId: string, period: string): Promise<BudgetOverview> {
    await dbConnect();

    // --- LOAD BUDGET (with carry-over fallback) ---
    let budget = await MonthlyBudget.findOne({ user: userId, period, isDeleted: false }).lean() as any;

    if (!budget || budget.envelopes.length === 0) {
      // Carry-over from last month's envelope limits (limits only, not spending)
      const lastBudget = await MonthlyBudget.findOne({ user: userId, isDeleted: false })
        .sort({ period: -1 })
        .lean() as any;

      if (lastBudget && lastBudget.envelopes?.length > 0) {
        // Auto-create for this period from last month's limits
        const carried = lastBudget.envelopes.map((e: any) => ({
          groupName: e.groupName,
          type: e.type,
          icon: e.icon,
          color: e.color,
          limit: e.limit,
        }));
        const created = await MonthlyBudget.findOneAndUpdate(
          { user: userId, period },
          { user: userId, period, income: lastBudget.income || 0, envelopes: carried, isDeleted: false },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        budget = created;
      }
    }

    const envelopeLimits: IEnvelope[] = budget?.envelopes || [];
    const income = budget?.income || 0;

    // --- AGGREGATE TRANSACTIONS ---
    const userWallets = await Wallet.find({ owner: userId, isDeleted: false }).distinct("_id");
    const startDate = startOfMonth(parseISO(`${period}-01`));
    const endDate = endOfMonth(startDate);

    const { default: Category } = await import("@/models/Category");

    // Get spending grouped by category
    const allExpenses = await Transaction.aggregate([
      {
        $match: {
          wallet: { $in: userWallets },
          date: { $gte: startDate, $lte: endDate },
          type: "EXPENSE",
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$category",
          totalSpent: { $sum: "$amount" },
        },
      },
    ]);

    // Build spending map: categoryId -> amount
    const spendingByCat = new Map<string, number>();
    for (const e of allExpenses) {
      if (e._id) spendingByCat.set(e._id.toString(), e.totalSpent);
    }

    // Build category → group map + group → categoryIds map
    const allCats = await Category.find({ isDeleted: false }).select("_id group").lean();
    const catToGroup = new Map<string, string>();
    const groupToCatIds = new Map<string, string[]>();
    for (const cat of allCats as any[]) {
      if (cat.group) {
        const id = cat._id.toString();
        catToGroup.set(id, cat.group);
        const arr = groupToCatIds.get(cat.group) || [];
        arr.push(id);
        groupToCatIds.set(cat.group, arr);
      }
    }

    // Aggregate spending per group
    const spendingByGroup = new Map<string, number>();
    for (const [catId, amount] of spendingByCat.entries()) {
      const group = catToGroup.get(catId);
      if (group) {
        spendingByGroup.set(group, (spendingByGroup.get(group) || 0) + amount);
      }
    }

    // Realized income
    const incomeStats = await Transaction.aggregate([
      {
        $match: {
          wallet: { $in: userWallets },
          date: { $gte: startDate, $lte: endDate },
          type: "INCOME",
          isDeleted: false,
        },
      },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    ]);
    const realizedIncome = incomeStats[0]?.totalIncome || 0;

    // Days remaining in month
    const today = new Date();
    const isCurrentMonth = period === today.toISOString().slice(0, 7);
    const daysRemaining = isCurrentMonth
      ? Math.max(1, differenceInCalendarDays(endDate, today))
      : 0;

    // --- BUILD ENVELOPE OVERVIEWS ---
    const budgetedGroupNames = new Set<string>();
    let totalBudget = 0;

    const envelopes: EnvelopeOverview[] = envelopeLimits.map((env) => {
      budgetedGroupNames.add(env.groupName);
      const spent = spendingByGroup.get(env.groupName) || 0;
      const remaining = Math.max(0, env.limit - spent);
      const percent = env.limit > 0 ? Math.min(100, (spent / env.limit) * 100) : 0;
      const safeToSpendToday = daysRemaining > 0 && remaining > 0 ? remaining / daysRemaining : 0;

      totalBudget += env.limit;

      return {
        groupName: env.groupName,
        type: env.type,
        icon: env.icon,
        color: env.color,
        limit: env.limit,
        spent,
        remaining,
        percent,
        safeToSpendToday,
        categoryIds: groupToCatIds.get(env.groupName) || [],
      };
    });

    // Sort envelopes: NEEDS first, then WANTS, then alphabetical
    envelopes.sort((a, b) => {
      const order = { NEEDS: 0, WANTS: 1, SAVINGS: 2 };
      const diff = order[a.type] - order[b.type];
      if (diff !== 0) return diff;
      return a.groupName.localeCompare(b.groupName);
    });

    // Unbudgeted spending = spending from groups with no envelope
    let unbudgetedSpent = 0;
    for (const [groupName, amount] of spendingByGroup.entries()) {
      if (!budgetedGroupNames.has(groupName)) unbudgetedSpent += amount;
    }

    // Also include spending from categories with no group
    for (const [catId, amount] of spendingByCat.entries()) {
      if (!catToGroup.has(catId)) unbudgetedSpent += amount;
    }

    const totalSpent = envelopes.reduce((acc, e) => acc + e.spent, 0) + unbudgetedSpent;

    return {
      period,
      income,
      realizedIncome,
      envelopes,
      unbudgetedSpent,
      totalBudget,
      totalSpent,
      daysRemaining,
    };
  },
};
