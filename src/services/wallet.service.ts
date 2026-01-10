import Wallet from "../models/Wallet";
import { TransactionType } from "../models/Transaction";
import Transaction from "../models/Transaction";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format, isSameMonth } from "date-fns";
import dbConnect from "../lib/db";

export async function getWallets(owner?: string) {
  await dbConnect();

  const matchStage: any = { isDeleted: false };
  if (owner && owner !== "ALL") {
      // Check if owner is a valid ObjectId, if so use it directly
      const mongoose = (await import("mongoose")).default;
      if (mongoose.Types.ObjectId.isValid(owner)) {
          matchStage.owner = new mongoose.Types.ObjectId(owner);
      } else {
          // Otherwise resolve username to ID
          const { default: User } = await import("../models/User");
          const user = await User.findOne({ username: { $regex: new RegExp(`^${owner}$`, "i") } }).select("_id");
          if (user) {
              matchStage.owner = user._id;
          } else {
              // User specified but not found -> return empty
              return [];
          }
      }
  }

  // Aggregate to calculate current balance
  // Simplified: Since Transfers are now Income/Expense, we just sum accordingly.
  const wallets = await Wallet.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "transactions",
        let: { walletId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$isDeleted", false] },
                  { $ne: ["$status", "PENDING"] },
                  { $eq: ["$wallet", "$$walletId"] }, // Only check 'wallet' field now as targetWallet is for reference/linkage
                ],
              },
            },
          },
        ],
        as: "transactions",
      },
    },
    {
      $addFields: {
        balanceImpact: {
          $sum: {
            $map: {
              input: "$transactions",
              as: "txn",
              in: {
                $cond: [
                   { $eq: ["$$txn.type", TransactionType.EXPENSE] },
                   { $multiply: ["$$txn.amount", -1] }, 
                   { $multiply: ["$$txn.amount", 1] }  // Income
                ]
              }
            }
          }
        },
      },
    },
    {
      $addFields: {
        currentBalance: { $add: ["$initialBalance", "$balanceImpact"] },
        color: { $ifNull: ["$color", "BLUE"] },
      },
    },
    {
      $project: {
        transactions: 0,
      },
    },
  ]);

  return wallets.map(wallet => ({
      ...wallet,
      _id: wallet._id.toString(),
      owner: wallet.owner?.toString(),
      liabilityDetails: wallet.liabilityDetails ? {
          ...wallet.liabilityDetails,
          startDate: wallet.liabilityDetails.startDate ? new Date(wallet.liabilityDetails.startDate).toISOString() : undefined
      } : undefined
  }));
}

export async function getWalletById(id: string) {
    await dbConnect();
    const mongoose = (await import("mongoose")).default;

    const wallets = await Wallet.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "transactions",
            let: { walletId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$isDeleted", false] },
                      { $ne: ["$status", "PENDING"] },
                      { $eq: ["$wallet", "$$walletId"] },
                    ],
                  },
                },
              },
            ],
            as: "transactions",
          },
        },
        {
          $addFields: {
            balanceImpact: {
              $sum: {
                $map: {
                  input: "$transactions",
                  as: "txn",
                  in: {
                    $cond: [
                        { $eq: ["$$txn.type", TransactionType.EXPENSE] },
                        { $multiply: ["$$txn.amount", -1] },
                        { $multiply: ["$$txn.amount", 1] } 
                    ]
                  }
                }
              }
            },
          },
        },
        {
          $addFields: {
            currentBalance: { $add: ["$initialBalance", "$balanceImpact"] },
            color: { $ifNull: ["$color", "BLUE"] },
          },
        },
        {
          $project: {
            transactions: 0, 
          },
        },
      ]);

      if (wallets.length === 0) return null;
      
      const wallet = wallets[0];
      return {
          ...wallet,
          _id: wallet._id.toString(),
          owner: wallet.owner?.toString(),
          liabilityDetails: wallet.liabilityDetails ? {
            ...wallet.liabilityDetails,
            startDate: wallet.liabilityDetails.startDate ? new Date(wallet.liabilityDetails.startDate).toISOString() : undefined
        } : undefined
      };
}

export async function getNetWorth() {
    const wallets = await getWallets();
    return wallets.reduce((sum, w) => sum + (w.currentBalance || 0), 0);
}

export async function getWalletAnalyticsData(walletId: string, searchParams: any) {
  await dbConnect();
  
  // 1. Determine Date Range
  let start: Date, end: Date;
  let mode = searchParams.mode || "MONTH";

  if (mode === "MONTH") {
      const monthStr = searchParams.month || new Date().toISOString().slice(0, 7);
      const date = new Date(monthStr);
      start = startOfMonth(date);
      if (isSameMonth(date, new Date())) {
          end = new Date(); 
      } else {
          end = endOfDay(endOfMonth(date)); 
      }
  } else if ((mode === "RANGE" || mode === "PRESET") && searchParams.startDate && searchParams.endDate) {
      start = new Date(searchParams.startDate);
      end = new Date(searchParams.endDate);
  } else if (mode === "ALL") {
      const firstTxn = await Transaction.findOne({ 
          isDeleted: false, 
          $or: [{ wallet: walletId }, { targetWallet: walletId }] 
      }).sort({ date: 1 }).select("date").lean();
      
      start = firstTxn ? startOfMonth(firstTxn.date) : startOfMonth(new Date());
      end = new Date();
  } else {
      // Default: Last 3 Months (as requested by user)
      const now = new Date();
      start = subMonths(now, 3);
      end = now;
  }

  // 2. Base Query
  const baseQuery: any = {
      isDeleted: false,
      date: { $gte: start, $lte: end },
      wallet: walletId, // Only query where this wallet is the owner
  };

  // 3. Apply Filters
  if (searchParams.type && searchParams.type !== "ALL") {
      if (searchParams.type === TransactionType.TRANSFER) {
          // Special handling for Transfer filter request: Look for isTransfer flag OR legacy TRANSFER type
          baseQuery.$or = [
              { type: TransactionType.TRANSFER },
              { isTransfer: true }
          ];
      } else if (searchParams.type === "GOAL") {
          baseQuery['goalItem'] = { $exists: true, $ne: null };
      } else {
          baseQuery['type'] = searchParams.type;
      }
  }

  // User Filter Logic
  // Requires currentUser to be passed in searchParams or handled by caller context (we will use searchParams for now to keep service stateless from session if possible, but standard way is usually arg)
  // Actually, let's look for 'userFilter' in searchParams. 
  // We need 'currentUser' to know who 'ME' is.
  // We will assume the caller injects 'currentUser' into searchParams for the service layer if strictly necessary, OR we prefer adding an argument.
  // Given strict signature, I'll check if searchParams can carry 'currentUser'. It's safer to add an optional argument to the function signature, but to minimize refactor I'll stick to searchParams extraction if possible. 
  // Wait, I can just change the function signature.
  const currentUser = searchParams.currentUser; // Caller must provide this!
  const userFilter = searchParams.userFilter || "ME"; // Default to ME

  if (currentUser) {
      if (userFilter === "ME") {
          baseQuery['createdBy'] = currentUser;
      } else if (userFilter === "OTHERS") {
         baseQuery['createdBy'] = { $ne: currentUser };
      }
      // ALL = no filter
  }
  
  if (searchParams.categoryId && searchParams.categoryId !== "ALL") baseQuery['category'] = searchParams.categoryId;
  if (searchParams.minAmount) {
      baseQuery['amount'] = { ...baseQuery['amount'], $gte: Number(searchParams.minAmount) };
  }
  if (searchParams.maxAmount) {
      baseQuery['amount'] = { ...baseQuery['amount'], $lte: Number(searchParams.maxAmount) };
  }
  
  // Goal Filter
  if (searchParams.goalId && searchParams.goalId !== "ALL") {
       // Find all items for this goal
       const { default: GoalItem } = await import("../models/GoalItem");
       const items = await GoalItem.find({ goalId: searchParams.goalId }).select("_id");
       const itemIds = items.map(i => i._id);
       baseQuery['goalItem'] = { $in: itemIds };
  }

  // 4. Fetch Data
  // 4. Fetch Data with Pagination
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 50; // Default 50 per page as requested
  const skip = (page - 1) * limit;

  const totalTransactions = await Transaction.countDocuments(baseQuery);
  const totalPages = Math.ceil(totalTransactions / limit);

  // 4. Fetch Paginated Transactions for List
  const transactions = await Transaction.find(baseQuery)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category wallet targetWallet")
      .populate({
        path: "relatedTransactionId",
        populate: { path: "wallet" }
      })
      .populate("createdBy", "username name")
      .lean();

  // 5. Aggregation for Stats (Summary, Category, Daily)
  // We need to match the same baseQuery.
  // Note: baseQuery uses Mongoose syntax. For aggregation, we might need to cast ObjectIds if they are strings in baseQuery (but they seem to be strings/dates which is fine if schema matches).
  // However, walletId is a string, schema uses ObjectId. Mongoose find() casts auto, Aggregation does NOT.
  // baseQuery.wallet is `walletId` string. We need to cast it.
  
  const mongoose = (await import("mongoose")).default;
  const aggMatch: any = { ...baseQuery };
  if (aggMatch.wallet) aggMatch.wallet = new mongoose.Types.ObjectId(aggMatch.wallet);
  if (aggMatch.category) aggMatch.category = new mongoose.Types.ObjectId(aggMatch.category);
  // Date is Date object, fine.
  // TransactionType "EXPENSE"/"INCOME" string, fine.
  // goalItem $exists or $in checks. $in needs ObjectId casting if array of strings.
  if (aggMatch.goalItem && aggMatch.goalItem.$in) {
      aggMatch.goalItem.$in = aggMatch.goalItem.$in.map((id: any) => new mongoose.Types.ObjectId(id));
  }
  
  const statsAggregation = await Transaction.aggregate([
      { $match: aggMatch },
      {
          $facet: {
              "summary": [
                  {
                      $group: {
                          _id: null,
                          totalIncome: { 
                              $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } 
                          },
                          totalExpense: { 
                              $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } 
                          }
                      }
                  }
              ],
              "byCategory": [
                 {
                     $group: {
                         _id: { 
                             category: "$category", 
                             type: "$type" 
                         }, 
                         total: { $sum: "$amount" }
                     }
                 },
                 {
                    $lookup: {
                        from: "categories",
                        localField: "_id.category",
                        foreignField: "_id",
                        as: "categoryDoc"
                    }
                 },
                 {
                     $project: {
                         type: "$_id.type",
                         name: { $ifNull: [ { $arrayElemAt: ["$categoryDoc.name", 0] }, "Uncategorized" ] },
                         value: "$total"
                     }
                 }
              ],
              "daily": [
                  {
                      $group: {
                          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                          income: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
                          expense: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } }
                      }
                  }
              ]
          }
      }
  ]);

  const stats = statsAggregation[0];
  const summaryResult = stats.summary[0] || { totalIncome: 0, totalExpense: 0 };
  const income = summaryResult.totalIncome;
  const expense = summaryResult.totalExpense;

  // Process Category Props
  const expenseByCategory = stats.byCategory
      .filter((i: any) => i.type === "EXPENSE")
      .map((i: any) => ({ name: i.name, value: i.value }))
      .sort((a: any, b: any) => b.value - a.value);

  const incomeByCategory = stats.byCategory
      .filter((i: any) => i.type === "INCOME")
      .map((i: any) => ({ name: i.name, value: i.value }))
      .sort((a: any, b: any) => b.value - a.value);

  // 7. Days Diff
  const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  // 8. Daily Trend Array
  const { eachDayOfInterval } = await import("date-fns");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyTrend: any[] = [];
  const dailyMap = new Map<string, { income: number, expense: number }>();
  stats.daily.forEach((d: any) => {
      dailyMap.set(d._id, { income: d.income, expense: d.expense });
  });

  if (daysDiff <= 370) {
      const interval = eachDayOfInterval({ start, end });
      interval.forEach(date => {
          const key = format(date, "yyyy-MM-dd");
          const data = dailyMap.get(key) || { income: 0, expense: 0 };
          dailyTrend.push({
              date: key,
              label: format(date, "d MMM"),
              income: data.income,
              expense: data.expense
          });
      });
  }

  // 9. Monthly Trend (Keep explicit legacy method or refactor? Keeping legacy for safety as it uses wider date range)
  const trendStart = subMonths(startOfMonth(new Date()), 5); 
  const trendEnd = endOfMonth(new Date());
  
  // This aggregation could be optimized too, but let's stick to the immediate fix which is the main summary/charts respecting the filter.
  // The monthly trend is "Last 6 Months" typically for context, usually independent of filter, OR it should respect filter if filter > 6 months? 
  // Usually 'Monthly Trend' card is distinct. 
  // Let's keep existing logic for Monthly Trend as it has its own date range hardcoded (Last 6 months).

  const trendTransactions = await Transaction.find({
      isDeleted: false,
      date: { $gte: trendStart, $lte: trendEnd },
      wallet: walletId,
  }).lean();

  const trendMap = new Map<string, { income: number, expense: number }>();
  for (let i = 0; i < 6; i++) {
     const d = subMonths(new Date(), i);
     const key = format(d, "MMM yyyy");
     trendMap.set(key, { income: 0, expense: 0 });
  }

  for (const txn of trendTransactions) {
      const key = format(txn.date, "MMM yyyy");
      if (!trendMap.has(key)) continue;
      const entry = trendMap.get(key)!;
      
      if (txn.type === TransactionType.INCOME) entry.income += txn.amount;
      else if (txn.type === TransactionType.EXPENSE) entry.expense += txn.amount;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthlyTrend: any[] = [];
  
  for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "MMM yyyy");
      const data = trendMap.get(key) || { income: 0, expense: 0 };
      monthlyTrend.push({ name: key, ...data });
  }

  return {
      summary: {
          income,
          expense,
          net: income - expense,
          avgDailyIncome: income / daysDiff,
          avgDailyExpense: expense / daysDiff
      },
      expenseByCategory,
      incomeByCategory,
      dailyTrend,
      monthlyTrend,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactions: transactions.map((t: any) => ({
          ...t,
          _id: t._id.toString(),
          wallet: { name: t.wallet.name, _id: t.wallet._id.toString() },
          targetWallet: t.targetWallet ? { name: t.targetWallet.name, _id: t.targetWallet._id.toString() } : undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: t.category ? { name: (t.category as any).name } : undefined,
          date: t.date.toISOString(),
          routineId: t.routineId ? t.routineId.toString() : undefined,
          goalItem: t.goalItem ? t.goalItem.toString() : undefined,
          project: t.project ? t.project.toString() : undefined,
          budgetItem: t.budgetItem ? t.budgetItem.toString() : undefined,
          createdAt: t.createdAt ? t.createdAt.toISOString() : undefined,
          updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          createdBy: (t.createdBy as any)?.username || (t.createdBy as any)?.name || "Unknown",
          isTransfer: t.isTransfer,
          relatedTransaction: t.relatedTransactionId ? {
              _id: t.relatedTransactionId._id.toString(),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              wallet: t.relatedTransactionId.wallet ? {
                  name: t.relatedTransactionId.wallet.name,
                  _id: t.relatedTransactionId.wallet._id.toString()
          } : undefined,
          } : undefined,
          relatedTransactionId: t.relatedTransactionId ? t.relatedTransactionId._id.toString() : undefined
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalTransactions,
        limit
      }
  };
}
