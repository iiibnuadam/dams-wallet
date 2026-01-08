import Wallet from "../models/Wallet";
import { TransactionType } from "../models/Transaction";
import Transaction from "../models/Transaction";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format, isSameMonth } from "date-fns";
import dbConnect from "../lib/db";

export async function getWallets(owner?: string) {
  await dbConnect();

  const matchStage: any = { isDeleted: false };
  if (owner && owner !== "ALL") {
      matchStage.owner = owner;
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

  // 4. Fetch Data
  // 4. Fetch Data with Pagination
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 50; // Default 50 per page as requested
  const skip = (page - 1) * limit;

  const totalTransactions = await Transaction.countDocuments(baseQuery);
  const totalPages = Math.ceil(totalTransactions / limit);

  const transactions = await Transaction.find(baseQuery)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category wallet targetWallet")
      .populate({
        path: "relatedTransactionId",
        populate: { path: "wallet" }
      })
      .lean();

  // 5. Process Data
  let income = 0;
  let expense = 0;
  const expenseMap = new Map<string, number>();
  const incomeMap = new Map<string, number>();
  const dailyMap = new Map<string, { income: number, expense: number }>();

  const addToMap = (map: Map<string, number>, key: string, amount: number) => {
      map.set(key, (map.get(key) || 0) + amount);
  };

  for (const txn of transactions) {
      const txnAmount = txn.amount;
      
      let type: 'INCOME' | 'EXPENSE' | 'NONE' = 'NONE';
      let catName = "Uncategorized";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const catObj = (txn.category as any);
      if (catObj) catName = catObj.name;
      
      // Override category name for transfers for better grouping if uncategorized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((txn as any).isTransfer) {
          if (txn.type === TransactionType.EXPENSE) catName = "Transfer Out";
          else catName = "Transfer In";
      }

      if (txn.type === TransactionType.INCOME) {
          type = 'INCOME';
      } else if (txn.type === TransactionType.EXPENSE) {
          type = 'EXPENSE';
      }

      // Aggregations
      if (type === 'INCOME') {
          income += txnAmount;
          const catId = catObj?._id?.toString() || catName; 
          addToMap(incomeMap, catId, txnAmount);
          
          const dayKey = format(txn.date, "yyyy-MM-dd");
          if (!dailyMap.has(dayKey)) dailyMap.set(dayKey, { income: 0, expense: 0 });
          dailyMap.get(dayKey)!.income += txnAmount;

      } else if (type === 'EXPENSE') {
          expense += txnAmount;
          const catId = catObj?._id?.toString() || catName;
          addToMap(expenseMap, catId, txnAmount);

          const dayKey = format(txn.date, "yyyy-MM-dd");
          if (!dailyMap.has(dayKey)) dailyMap.set(dayKey, { income: 0, expense: 0 });
          dailyMap.get(dayKey)!.expense += txnAmount;
      }
  }

  // 6. Format Category Data
  const resolveCategoryStats = async (map: Map<string, number>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stats: any[] = [];
      const keys = Array.from(map.keys());
      const dbIds = keys.filter(k => k.match(/^[0-9a-fA-F]{24}$/));
      
      let categories: any[] = [];
      if (dbIds.length > 0) {
          const { default: CategoryModel } = await import("../models/Category");
          categories = await CategoryModel.find({ _id: { $in: dbIds } }).lean();
      }

      map.forEach((val, key) => {
          const cat = categories.find(c => c._id.toString() === key);
          const name = cat ? cat.name : key; 
          stats.push({ name, value: val });
      });
      return stats.sort((a, b) => b.value - a.value);
  };

  const expenseByCategory = await resolveCategoryStats(expenseMap);
  const incomeByCategory = await resolveCategoryStats(incomeMap);

  // 7. Days Diff
  const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  // 8. Daily Trend Array
  const { eachDayOfInterval } = await import("date-fns");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyTrend: any[] = [];
  
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

  // 9. Monthly Trend
  const trendStart = subMonths(startOfMonth(new Date()), 5); 
  const trendEnd = endOfMonth(new Date());
  
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
          createdAt: t.createdAt ? t.createdAt.toISOString() : undefined,
          updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
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
