import MonthlyBudget, { IMonthlyBudget } from "@/models/MonthlyBudget";
import Transaction from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import { startOfMonth, endOfMonth, parseISO, differenceInCalendarDays, differenceInCalendarWeeks } from "date-fns";

export interface BudgetItemOverview {
    _id?: string;
    name: string;
    limit: number;
    trackingType: "DAILY" | "WEEKLY" | "MONTHLY";
    categories: string[];
    spent: number;
    remaining: number;
    safeToSpendDaily?: number;
    safeToSpendWeekly?: number;
}

export interface BudgetGroupOverview {
  _id?: string; 
  name: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
  
  // Mixed Mode: Can be Parent (items > 0) or Leaf (items == 0)
  items: BudgetItemOverview[];
  isLeaf: boolean;

  // Aggregated or Direct
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;

  safeToSpendDaily: number;

  // Leaf props
  limit?: number;
  trackingType?: "DAILY" | "WEEKLY" | "MONTHLY";
  targetGroup?: string;
  categories?: string[];
}

export interface BudgetOverview {
  period: string;
  income: number;
  realizedIncome: number;
  groups: BudgetGroupOverview[];
  totalBudget: number;
  totalSpent: number;
  daysRemaining: number;
  weeksRemaining: number;
}

export const BudgetService = {
  async getBudgetForMonth(userId: string, period: string): Promise<IMonthlyBudget | null> {
    await dbConnect();
    const existingBudget = await MonthlyBudget.findOne({ user: userId, period, isDeleted: false });

    if (existingBudget) return existingBudget;

    const lastBudget = await MonthlyBudget.findOne({ user: userId, isDeleted: false }).sort({ period: -1 });
    if (lastBudget) {
      const template = lastBudget.toObject() as any;
      delete template._id;
      delete template.period;
      delete template.createdAt;
      delete template.updatedAt;
      return template as unknown as IMonthlyBudget;
    }

    return null;
  },

  async upsertBudget(userId: string, period: string, groups: any[], income: number = 0) {
    await dbConnect();
    
    // Clean up groups data to match schema
    const cleanGroups = groups.map(g => ({
        name: g.name,
        type: g.type || "NEEDS",
        icon: g.icon,
        color: g.color,
        // Simple Mode Fields
        limit: g.limit || 0,
        trackingType: g.trackingType || "MONTHLY",
        targetGroup: g.targetGroup, // NEW
        categories: (g.categories || []).map((c: string) => new mongoose.Types.ObjectId(c)),
        // Nested Mode Fields
        items: (g.items || []).map((i: any) => ({
             name: i.name,
             limit: i.limit,
             trackingType: i.trackingType,
             categories: i.categories.map((c: string) => new mongoose.Types.ObjectId(c))
        }))
    }));

    const budget = await MonthlyBudget.findOneAndUpdate(
      { user: userId, period },
      {
        user: userId,
        period,
        income,
        groups: cleanGroups,
        isDeleted: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return budget;
  },

  async autoGenerateBudget(userId: string, period: string) {
    await dbConnect();
    
    // Check if budget exists
    const existing = await MonthlyBudget.findOne({ user: userId, period, isDeleted: false });
    if (existing && existing.groups.length > 0) {
        return existing; // Don't overwrite if exists
    }

    const { default: Category } = await import("@/models/Category");
    const categories = await Category.find({ isDeleted: false, type: "EXPENSE" }).lean();
    
    // Group categories by Bucket + Group
    // Key: "NEEDS:Food" -> { group: "Food", type: "NEEDS", icon: "...", color: "..." }
    const groupMap = new Map<string, any>();
    
    categories.forEach((cat: any) => {
        if (!cat.group || !cat.bucket) return;
        
        const key = `${cat.bucket}:${cat.group}`;
        if (!groupMap.has(key)) {
            groupMap.set(key, {
                name: cat.group,
                type: cat.bucket, // NEEDS or WANTS
                icon: cat.icon || "📁",
                color: cat.color || "#6b7280",
                limit: 0,
                trackingType: "MONTHLY",
                targetGroup: cat.group, // Auto-link
                categories: []
            });
        }
    });

    const newGroups = Array.from(groupMap.values());
    
    // Sort: Needs first, then Wants. Inside: Alphabetical.
    newGroups.sort((a, b) => {
        if (a.type !== b.type) return a.type === "NEEDS" ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    const budget = await MonthlyBudget.findOneAndUpdate(
      { user: userId, period },
      {
        user: userId,
        period,
        groups: newGroups,
        isDeleted: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    return budget;
  },

  async getBudgetOverview(userId: string, period: string, owner?: string): Promise<BudgetOverview> {
    await dbConnect();

    let targetUserIds: string[] = [];

    if (owner && owner !== "ALL") {
        const { default: User } = await import("@/models/User");
        const user = await User.findOne({ username: { $regex: new RegExp(`^${owner}$`, "i") } }).select("_id");
        if (user) {
            targetUserIds = [user._id.toString()];
        } else {
             return { period, income: 0, realizedIncome: 0, groups: [], totalBudget: 0, totalSpent: 0, daysRemaining: 0, weeksRemaining: 0 };
        }
    } else if (owner === "ALL") {
        const { default: User } = await import("@/models/User");
        const users = await User.find({ username: { $in: ["ADAM", "SASTI"] } }).select("_id");
        targetUserIds = users.map(u => u._id.toString());
    } else {
        // Default to current logged-in user
        targetUserIds = [userId];
    }

    // --- AGGREGATE BUDGETS ---
    // If multiple users, we fetch multiple budgets and merge them
    const budgets = await MonthlyBudget.find({ user: { $in: targetUserIds }, period, isDeleted: false });
    
    // REMOVED: Fallback to last month's budget. 
    // User requested "tampilin apa adanya" (show as is). If no budget, show empty.

    // --- AGGREGATE TRANSACTIONS ---
    const userWallets = await Wallet.find({ owner: { $in: targetUserIds }, isDeleted: false }).distinct('_id');
    const startDate = startOfMonth(parseISO(`${period}-01`));
    const endDate = endOfMonth(startDate);
    
    const allExpenses = await Transaction.aggregate([
      {
        $match: {
          wallet: { $in: userWallets },
          date: { $gte: startDate, $lte: endDate },
          type: "EXPENSE",
          isDeleted: false,
        }
      },
      {
         $group: {
            _id: "$category",
            totalSpent: { $sum: "$amount" }
         }
      }
    ]);

    const incomeStats = await Transaction.aggregate([
      {
        $match: {
          wallet: { $in: userWallets },
          date: { $gte: startDate, $lte: endDate },
          type: "INCOME",
          isDeleted: false,
        }
      },
      {
         $group: {
            _id: null,
            totalIncome: { $sum: "$amount" }
         }
      }
    ]);
    const realizedIncome = incomeStats[0]?.totalIncome || 0;

    const spendingMap = new Map<string, number>();
    allExpenses.forEach(item => {
        if (item._id) spendingMap.set(item._id.toString(), item.totalSpent);
    });

    const today = new Date();
    let daysRemaining = 0;
    let weeksRemaining = 0;
    const isCurrentMonth = period === today.toISOString().slice(0, 7);
    
    if (isCurrentMonth) {
        daysRemaining = Math.max(1, differenceInCalendarDays(endDate, today));
        weeksRemaining = Math.max(1, differenceInCalendarWeeks(endDate, today));
    } else if (new Date(period) > today) {
        daysRemaining = differenceInCalendarDays(endDate, startDate);
        weeksRemaining = 4;
    }

    // --- FETCH CATEGORY GROUPS & BUCKETS ---
    const { default: Category } = await import("@/models/Category");
    const allCategories = await Category.find({ isDeleted: false }).select("_id group bucket").lean();
    
    // Map ID -> { group, bucket }
    const categoryInfoMap = new Map<string, { group: string, bucket: string }>();
    allCategories.forEach((cat: any) => {
        if (cat.group) categoryInfoMap.set(cat._id.toString(), { group: cat.group, bucket: cat.bucket });
    });

    const getSpentForGroup = (targetGroup: string, targetBucket?: string) => {
        let total = 0;
        for (const [catId, amount] of spendingMap.entries()) {
            const info = categoryInfoMap.get(catId);
            if (!info) continue;

            const groupMatch = info.group === targetGroup;
            const bucketMatch = targetBucket ? info.bucket === targetBucket : true;

            // If targetBucket is provided (e.g. NEEDS), we only match categories in that bucket.
            if (groupMatch && bucketMatch) {
                total += amount;
            }
        }
        return total;
    };

    const resultGroups: BudgetGroupOverview[] = [];
    let globalLimit = 0;
    let globalSpent = 0;
    let totalPlannedIncome = 0;

    // Process all found budgets (could be 1 or 2)
    for (const budget of budgets) {
        totalPlannedIncome += (budget as any).income || 0;

        for (const group of (budget.groups || [])) {
            // Check if complex (has items) or simple (no items)
            const hasItems = group.items && group.items.length > 0;
            
            const resultItems: BudgetItemOverview[] = [];
            let groupTotalLimit = 0;
            let groupTotalSpent = 0;
    
            if (hasItems) {
                // ... (Complex Mode remains same - item based) ...
                for (const item of (group.items || [])) {
                     // ... same item logic ...
                     let itemSpent = 0;
                     const itemCatIds: string[] = [];
                     
                     item.categories.forEach((catId: any) => {
                         const cId = catId.toString();
                         itemCatIds.push(cId);
                         itemSpent += spendingMap.get(cId) || 0;
                     });
    
                     const remaining = Math.max(0, item.limit - itemSpent);
                     let safeToSpendDaily = 0;
                     if (item.trackingType === 'DAILY' && daysRemaining > 0) safeToSpendDaily = remaining / daysRemaining;
                     if (item.trackingType === 'WEEKLY' && weeksRemaining > 0) safeToSpendDaily = remaining / weeksRemaining / 7;
    
                     resultItems.push({
                         _id: (item as any)._id?.toString(),
                         name: item.name,
                         limit: item.limit,
                         trackingType: item.trackingType,
                         categories: itemCatIds,
                         spent: itemSpent,
                         remaining,
                         safeToSpendDaily: item.trackingType === 'WEEKLY' ? safeToSpendDaily * 7 : safeToSpendDaily
                     });
    
                     groupTotalLimit += item.limit;
                     groupTotalSpent += itemSpent;
                }
            } else {
                // --- SIMPLE MODE: Use Group Fields ---
                const gLimit = (group as any).limit || 0;
                const gTargetGroup = (group as any).targetGroup;
                const gType = (group as any).type; // NEEDS / WANTS
                
                let gSpent = 0;
                
                if (gTargetGroup) {
                    // NEW: Dynamic Group Matching (Filtered by Bucket/Type)
                    // If the group has a "targetGroup" (e.g. Food), we implicitly respect the Budget Group's "TYPE" (Needs/Wants)
                    // So "Food" in "Needs" section only counts "Food" categories that are "Needs".
                    // UPDATE: User requested to lax this. "Food" budget should count ALL "Food" spending regardless of type.
                    gSpent = getSpentForGroup(gTargetGroup);
                } else {
                    // OLD: Specific Category Matching
                    const gCats = (group as any).categories || [];
                    gCats.forEach((catId: any) => {
                         gSpent += spendingMap.get(catId.toString()) || 0;
                    });
                }
                
                groupTotalLimit = gLimit;
                groupTotalSpent = gSpent;
            }
    
            const groupRemaining = Math.max(0, groupTotalLimit - groupTotalSpent);
            let groupSafeDaily = 0;
            if (daysRemaining > 0) {
                groupSafeDaily = groupRemaining / daysRemaining;
            }
    
            resultGroups.push({
                _id: (group as any)._id?.toString(),
                name: group.name,
                type: (group as any).type || "NEEDS",
                icon: group.icon,
                color: group.color,
                items: resultItems,
                isLeaf: !hasItems,
                
                totalLimit: groupTotalLimit,
                totalSpent: groupTotalSpent,
                totalRemaining: groupRemaining,
                safeToSpendDaily: groupSafeDaily,
    
                // Raw fields for editing (Leaf Mode)
                limit: (group as any).limit || 0,
                trackingType: (group as any).trackingType || "MONTHLY",
                targetGroup: (group as any).targetGroup, // NEW
                categories: (group as any).categories ? (group as any).categories.map((c: any) => c.toString()) : []
            });
    
            globalLimit += groupTotalLimit;
            globalSpent += groupTotalSpent;
        }
    }

    return {
        period,
        income: totalPlannedIncome,
        realizedIncome,
        groups: resultGroups,
        totalBudget: globalLimit,
        totalSpent: globalSpent,
        daysRemaining,
        weeksRemaining
    };
  },

  async getBudgetTransactions(userId: string, period: string) {
    await dbConnect();
    const startDate = startOfMonth(parseISO(`${period}-01`));
    const endDate = endOfMonth(startDate);
    const userWallets = await Wallet.find({ owner: userId, isDeleted: false }).distinct('_id');

    const transactions = await Transaction.find({
        wallet: { $in: userWallets },
        date: { $gte: startDate, $lte: endDate },
        type: "EXPENSE",
        isDeleted: false
    })
    .sort({ date: -1 })
    .populate("category")
    .lean();

    return transactions;
  },

  async syncNewCategoryGroup(userId: string, category: any) {
    if (!category.group || !category.bucket) return;

    await dbConnect();
    const today = new Date();
    const period = today.toISOString().slice(0, 7); // YYYY-MM

    // Find current active budget
    const budget = await MonthlyBudget.findOne({ user: userId, period, isDeleted: false });
    if (!budget) return; // No budget to sync to

    // Check if group already exists (by name or targetGroup)
    const exists = budget.groups.some(g => g.name === category.group || g.targetGroup === category.group);
    
    if (!exists) {
        // Append new group
        const newGroup = {
            name: category.group,
            type: category.bucket, // NEEDS or WANTS
            icon: category.icon || "📁",
            color: category.color || "#6b7280",
            limit: 0,
            trackingType: "MONTHLY",
            targetGroup: category.group, // Auto-link
            categories: [] // Mixed mode support, but we rely on targetGroup for simple mode
        };
        
        await MonthlyBudget.findByIdAndUpdate(budget._id, {
            $push: { groups: newGroup }
        });
    }
  }
};
