import dbConnect from "@/lib/db";
import Goal, { IGoal } from "@/models/Goal";
import GoalItem, { IGoalItem } from "@/models/GoalItem";
import mongoose from "mongoose";

export async function createGoal(data: Partial<IGoal>) {
  await dbConnect();
  const goal = await Goal.create(data);
  return JSON.parse(JSON.stringify(goal));
}

export async function createGoalItem(data: Partial<IGoalItem> & { groupId?: string }) {
  await dbConnect();
  if (data.groupId && typeof data.groupId === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.groupId = new mongoose.Types.ObjectId(data.groupId) as any;
  }
  const item = await GoalItem.create(data);
  return JSON.parse(JSON.stringify(item));
}

export async function updateGoalItem(id: string, data: Partial<IGoalItem> & { groupId?: string }) {
  await dbConnect();
  if (data.groupId && typeof data.groupId === 'string') {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.groupId = new mongoose.Types.ObjectId(data.groupId) as any;
  }
  const item = await GoalItem.findByIdAndUpdate(id, data, { new: true });
  return JSON.parse(JSON.stringify(item));
}

export async function setGoalItemCompletion(id: string, isCompleted: boolean) {
    await dbConnect();
    const item = await GoalItem.findByIdAndUpdate(id, { isCompleted }, { new: true });
    return JSON.parse(JSON.stringify(item));
}

export async function deleteGoalItem(id: string) {
  await dbConnect();
  await GoalItem.findByIdAndDelete(id);
  // Optional: Clean up transactions related to this item?
  return { success: true };
}

import { cache } from "react";

// Filtering logic:
// - If SHARED: Accessible to all (or check sharedWith if we restricted it later)
// - If PRIVATE: Accessible only if owner === currentUser
export const getGoals = cache(async (currentUser?: string) => {
  await dbConnect();
  
  const query: any = {};
  if (currentUser) {
      query.$or = [
          { visibility: "SHARED" },
          { owner: currentUser }
      ];
  } else {
      // If no user context, maybe just show SHARED? Or show none?
      // For safety, let's show only SHARED
      query.visibility = "SHARED";
  }

  // const goals = await Goal.find(query).sort({ targetDate: 1 }).lean();
  
  // Use aggregation to sum up estimated and actuals
  const goals = await Goal.aggregate([
      { $match: query },
      // 1. Lookup Items
      {
          $lookup: {
              from: "goalitems",
              localField: "_id",
              foreignField: "goalId",
              as: "items"
          }
      },
      // 2. Unwind items to lookup their transactions? Or loop?
      // Complicated to sum actuals inside a list view without heavy cost.
      // OPTIMIZATION: For list view, maybe we rely on a future "cached" field or just do a simpler lookup.
      // Let's try to do a lookup for ALL items, then lookup transactions.
      
      // Actually simpler:
      // Lookup Items.
      // For each item, lookup transactions? No, Mongo 5+ can do complex things but let's stick to simple if possible.
      // Alternative: Just lookup items and sum estimated. Actuals is harder because it's in transactions.
      
      // Let's iterate:
      // 1. Get Goals.
      // 2. Get All Items for these goals.
      // 3. Get All Transactions for these items.
      // This is safer than a massive aggregation if data is small-medium.
  ]);
  
  // RE-PLAN: The aggregation above is becoming complex for a simple tool call.
  // Let's stick to standard find first, then populate or aggregate manually in code if list is small (personal finance).
  
  const fetchedGoals = await Goal.find(query).sort({ targetDate: 1 }).lean();
  
  // Manual aggregation for simplicity and reliability here
  const goalsWithStats = await Promise.all(fetchedGoals.map(async (g: any) => {
       const items = await GoalItem.find({ goalId: g._id }).select('estimatedAmount _id').lean();
       const totalEstimated = items.reduce((sum, i) => sum + (i.estimatedAmount || 0), 0);
       
       const itemIds = items.map(i => i._id);
       const Transaction = mongoose.models.Transaction || mongoose.model("Transaction");
       
       // Aggregate actuals
       // We can just sum all transactions for these items
       const txStats = await Transaction.aggregate([
           { $match: { goalItem: { $in: itemIds }, isDeleted: false, type: "EXPENSE" } },
           { $group: { _id: null, total: { $sum: "$amount" } } }
       ]);
       
       const totalActual = txStats[0]?.total || 0;
       
       return {
           ...g,
           totalEstimated,
           totalActual
       };
  }));

  return JSON.parse(JSON.stringify(goalsWithStats));
});

export async function updateGoal(id: string, data: Partial<IGoal>) {
    await dbConnect();
    const goal = await Goal.findByIdAndUpdate(id, data, { new: true });
    return JSON.parse(JSON.stringify(goal));
}

export async function deleteGoal(id: string) {
    await dbConnect();
    await Goal.findByIdAndDelete(id);
    // Ideally delete items too, but keep simple for now
    await GoalItem.deleteMany({ goalId: id });
    return { success: true };
}

export const getGoalDetails = cache(async (goalId: string) => {
  await dbConnect();
  
  const id = new mongoose.Types.ObjectId(goalId);

  // Fetch the goal metadata
  const goal = await Goal.findById(id).lean();
  if (!goal) return null;

  // Aggregate items with actual transaction sums
  const items = await GoalItem.aggregate([
    { $match: { goalId: id } },
    {
      $lookup: {
        from: "transactions",
        let: { itemId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$goalItem", "$$itemId"] }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ],
        as: "transactionInfo"
      }
    },
    {
      $addFields: {
        actualAmount: { $ifNull: [{ $arrayElemAt: ["$transactionInfo.total", 0] }, 0] }
      }
    },
    { $unset: "transactionInfo" }
  ]);

  // Fetch all transactions related to these items
  const itemIds = items.map((i: any) => i._id);
  
  // Use a separate query for cleaner history fetching (easier than complex lookup inside existing aggregation for a flat list)
  const Transaction = mongoose.models.Transaction || mongoose.model("Transaction");
  const rawHistory = await Transaction.find({
      goalItem: { $in: itemIds },
      isDeleted: false
  })
  .populate("wallet") // Populate wallet if needed for display
  .populate({
      path: "goalItem",
      populate: { path: "goalId", select: "name" }
  })
  .populate("createdBy", "name")
  .sort({ date: -1 }) // Newest first
  .lean();

  // Safely serialize history to avoid "plain object" errors
  const history = rawHistory.map((txn: any) => ({
      ...txn,
      _id: txn._id.toString(),
      // Ensure goalItem is an object with strings if populated
      goalItem: txn.goalItem ? {
          _id: txn.goalItem._id.toString(),
          name: txn.goalItem.name,
          goal: txn.goalItem.goalId ? {
              _id: txn.goalItem.goalId._id.toString(),
              name: txn.goalItem.goalId.name
          } : undefined
      } : undefined,
      wallet: txn.wallet ? { ...txn.wallet, _id: txn.wallet._id?.toString() } : null,
      category: txn.category?.toString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createdBy: (txn.createdBy as any)?.username || (txn.createdBy as any)?.name || "Unknown",
  }));

  return {
    ...JSON.parse(JSON.stringify(goal)),
    items: JSON.parse(JSON.stringify(items)),
    history: JSON.parse(JSON.stringify(history))
  };
});

export async function addGroup(goalId: string, groupData: { name: string, parentGroupId?: string, color?: string, icon?: string }) {
    await dbConnect();
    const goal = await Goal.findById(goalId);
    if (!goal) throw new Error("Goal not found");

    if (!goal.groups) goal.groups = [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    goal.groups.push(groupData as any);
    
    await goal.save();
    return JSON.parse(JSON.stringify(goal));
}

export async function updateGroup(goalId: string, groupId: string, groupData: { name?: string, color?: string, icon?: string, parentGroupId?: string }) {
    await dbConnect();
    
    const goal = await Goal.findById(goalId);
    if (!goal) throw new Error("Goal not found");

    if (!goal.groups) return { success: false, message: "No groups found" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = (goal.groups as any).id(groupId);
    if (!group) throw new Error("Group not found");

    if (groupData.name) group.name = groupData.name;
    if (groupData.color) group.color = groupData.color;
    if (groupData.icon) group.icon = groupData.icon;
    // Allow moving groups
    if (groupData.parentGroupId !== undefined) {
         if (groupData.parentGroupId === "ROOT") {
             group.parentGroupId = undefined;
         } else {
             // Validate parent exists and is not self (circular check needed theoretically but skipping for now)
             group.parentGroupId = groupData.parentGroupId;
         }
    }

    await goal.save();
    return JSON.parse(JSON.stringify(goal));
}

export async function deleteGroup(goalId: string, groupId: string) {
    await dbConnect();
    const goal = await Goal.findById(goalId);
    if (!goal) throw new Error("Goal not found");

    // Check for items or subgroups
    // For now, allow force delete or just pull
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (goal.groups) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (goal.groups as any).pull({ _id: groupId });
    }
    
    await goal.save();
    
    // Cleanup items?
    // goalItems.updateMany({ groupId: groupId }, { $unset: { groupId: 1 } })
    
    return JSON.parse(JSON.stringify(goal));
}

// Deprecated but kept for compatibility until refactor complete
export async function upsertGroupStyle(goalId: string, groupData: { name: string, color?: string, icon?: string }) {
    // Forward to legacy behavior or mapping
    // This was name-based.
    await dbConnect();
    const goal = await Goal.findById(goalId);
    if (!goal) throw new Error("Goal not found");
    
    // Find group by name
    const existingGroup = goal.groups?.find((g: any) => g.name === groupData.name);
    if (existingGroup) {
        return updateGroup(goalId, existingGroup._id.toString(), groupData);
    } else {
        return addGroup(goalId, groupData);
    }
}
