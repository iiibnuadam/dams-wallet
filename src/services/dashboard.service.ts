import Transaction, { TransactionType } from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import dbConnect from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay, startOfWeek, endOfWeek, parse, startOfYear, endOfYear, isSameMonth } from "date-fns";
import "@/models/GoalItem"; // Register GoalItem schema
import "@/models/Goal"; // Register Goal schema
import "@/models/Category"; // Register Category schema
import "@/models/User"; // Register User schema
import "@/models/Wallet"; // Register Wallet schema
import "@/models/Routine"; // Register Routine schema
import mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDashboardData(owner?: string, searchParams: any = {}) {
  await dbConnect();
  
  // Ensure searchParams is an object to prevent assignment errors
  if (!searchParams) searchParams = {};
  
  let start: Date, end: Date;
  
  // Parse Search Params if provided
  if ((searchParams?.mode === "RANGE" || searchParams?.mode === "PRESET") && searchParams.startDate && searchParams.endDate) {
      const startStr = String(searchParams.startDate);
      const endStr = String(searchParams.endDate);
      const isStartExact = startStr.includes("T");
      const isEndExact = endStr.includes("T");

      start = isStartExact ? new Date(searchParams.startDate) : startOfDay(new Date(searchParams.startDate));
      end = isEndExact ? new Date(searchParams.endDate) : endOfDay(new Date(searchParams.endDate));
  } else if (searchParams?.mode === "WEEK" && searchParams.week) {
      const date = parse(searchParams.week, "RRRR-'W'II", new Date(), { weekStartsOn: 1 });
      start = startOfWeek(date, { weekStartsOn: 1 });
      end = endOfWeek(date, { weekStartsOn: 1 });
  } else if (searchParams?.mode === "MONTH" && searchParams.month) {
      const date = new Date(searchParams.month);
      start = startOfDay(startOfMonth(date)); 
      if (isSameMonth(date, new Date())) {
          end = new Date(); 
      } else {
          end = endOfDay(endOfMonth(date));
      }
  } else if (searchParams?.mode === "YEAR" && searchParams.year) {
      const date = parse(searchParams.year, "yyyy", new Date());
      start = startOfYear(date);
      end = endOfYear(date);
  } else if (searchParams?.mode === "ALL") {
      const firstTxn = await Transaction.findOne({ isDeleted: false }).sort({ date: 1 }).select("date").lean();
      start = firstTxn ? startOfMonth(firstTxn.date) : startOfMonth(new Date());
      end = new Date(); 
  } else {
      // Default: Month to Date (MTD)
      const now = new Date();
      start = startOfMonth(now); 
      end = now; 
  }
  
  const now = new Date(); 

  // 1. Identify "My Wallets" if owner is specified
  let myWalletIds: mongoose.Types.ObjectId[] = [];
  let ownerId = owner; 

  if (owner && owner !== "ALL") {
      const { default: User } = await import("@/models/User");
      const user = await User.findOne({ username: { $regex: new RegExp(`^${owner}$`, "i") } }).select("_id");
      
      if (user) {
          ownerId = user._id.toString();
          // Fetch full wallets for response and IDs for filtering
          const walletDocs = await Wallet.find({ owner: ownerId }).lean();
          myWalletIds = walletDocs.map(w => w._id);
          // @ts-ignore
          searchParams.wallets = walletDocs; // Store for return
      }
  } else if (!owner || owner === "ALL") {
       const { default: User } = await import("@/models/User");
       const defaultUser = await User.findOne({ username: { $regex: new RegExp("^ADAM$", "i") } }).select("_id");
       if (defaultUser) ownerId = defaultUser._id.toString();
        
       // Fetch all wallets for ALL view
       const walletDocs = await Wallet.find({}).lean();
       // @ts-ignore
       searchParams.wallets = walletDocs; 
  }

  // --- AGGREGATION PIPELINE HELPER ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchStage: any = {
      isDeleted: false,
      date: { $gte: start, $lte: end }
  };

  if (myWalletIds.length > 0) {
      matchStage.$or = [
          { wallet: { $in: myWalletIds } },
          { targetWallet: { $in: myWalletIds } }
      ];

  }

  const isGlobalView = myWalletIds.length === 0;

  // We need more detailed breakdown, so let's use Facets
  // pipeline for category breakdown
  const categoryPipeline = [
        { $match: matchStage },
        {
          $project: {
              amount: 1,
              type: 1,
              category: 1,
              date: 1,
              wallet: 1,
              targetWallet: 1,
              isTransfer: 1,
              isMySource: { 
                  $cond: { 
                      if: { $literal: isGlobalView }, then: true, else: { $in: ["$wallet", myWalletIds] } 
                  } 
              },
              isMyTarget: {
                  $cond: {
                      if: { $literal: isGlobalView }, then: { $gt: ["$targetWallet", null] }, else: { $in: ["$targetWallet", myWalletIds] }
                  }
              }
          }
      },
      {
          $facet: {
              summary: [
                  {
                      $group: {
                          _id: null,
                          income: {
                              $sum: {
                                  $cond: [
                                      { $or: [
                                          { $and: [{ $eq: ["$type", "INCOME"] }, { $eq: ["$isMySource", true] }] },
                                          { $and: [{ $eq: ["$type", "TRANSFER"] }, { $eq: ["$isMySource", false] }, { $eq: ["$isMyTarget", true] }] }
                                      ]},
                                      "$amount", 0
                                  ]
                              }
                          },
                          expense: {
                              $sum: {
                                  $cond: [
                                      { $or: [
                                          { $and: [{ $eq: ["$type", "EXPENSE"] }, { $eq: ["$isMySource", true] }] },
                                          { $and: [{ $eq: ["$type", "TRANSFER"] }, { $eq: ["$isMySource", true] }, { $eq: ["$isMyTarget", false] }] }
                                      ]},
                                      "$amount", 0
                                  ]
                              }
                          },
                          realIncome: {
                              $sum: {
                                  $cond: [
                                      { $and: [
                                          { $eq: ["$type", "INCOME"] }, 
                                          { $eq: ["$isMySource", true] },
                                          { $ne: [{ $ifNull: ["$isTransfer", false] }, true] }
                                      ]},
                                      "$amount", 0
                                  ]
                              }
                          },
                          realExpense: {
                              $sum: {
                                  $cond: [
                                      { $and: [
                                          { $eq: ["$type", "EXPENSE"] }, 
                                          { $eq: ["$isMySource", true] },
                                          { $ne: [{ $ifNull: ["$isTransfer", false] }, true] }
                                      ]},
                                      "$amount", 0
                                  ]
                              }
                          }
                      }
                  }
              ],
              incomeByCat: [
                  { $match: { $or: [
                      { type: "INCOME", $expr: { 
                          $cond: { if: { $literal: isGlobalView }, then: true, else: { $in: ["$wallet", myWalletIds] } } 
                      }},
                      { type: "TRANSFER", $expr: { 
                          $cond: { if: { $literal: isGlobalView }, then: false, else: { $and: [
                              { $not: { $in: ["$wallet", myWalletIds] } },
                              { $in: ["$targetWallet", myWalletIds] }
                          ]}}}
                      }
                  ]}},
                  { $group: { 
                      _id: { $ifNull: ["$category", "Uncategorized"] }, 
                      value: { $sum: "$amount" },
                      isTransfer: { $first: { $eq: ["$type", "TRANSFER"] } } // Tag transfers
                  }},
                  { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "catDetails" } },
                  { $project: { 
                      _id: 0,
                      name: { $ifNull: [{ $arrayElemAt: ["$catDetails.name", 0] }, { $cond: ["$isTransfer", "Transfer In", "Uncategorized"] }] }, 
                      value: 1,
                      icon: { $arrayElemAt: ["$catDetails.icon", 0] },
                      color: { $arrayElemAt: ["$catDetails.color", 0] }
                  }},
                  { $sort: { value: -1 } }
              ],
              expenseByCat: [
                  { $match: { $or: [
                      { type: "EXPENSE", $expr: { 
                          $cond: { if: { $literal: isGlobalView }, then: true, else: { $in: ["$wallet", myWalletIds] } } 
                      }},
                      { type: "TRANSFER", $expr: { 
                          $cond: { if: { $literal: isGlobalView }, then: false, else: { $and: [
                              { $in: ["$wallet", myWalletIds] },
                              { $not: { $in: ["$targetWallet", myWalletIds] } }
                          ]}}}
                      }
                  ]}},
                   { $group: { 
                      _id: { $ifNull: ["$category", "Uncategorized"] }, 
                      value: { $sum: "$amount" },
                      isTransfer: { $first: { $eq: ["$type", "TRANSFER"] } }
                  }},
                  { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "catDetails" } },
                  { $project: { 
                      _id: 0,
                      name: { $ifNull: [{ $arrayElemAt: ["$catDetails.name", 0] }, { $cond: ["$isTransfer", "Transfer Out", "Uncategorized"] }] }, 
                      value: 1,
                      icon: { $arrayElemAt: ["$catDetails.icon", 0] },
                      color: { $arrayElemAt: ["$catDetails.color", 0] }
                  }},
                  { $sort: { value: -1 } }
              ],
              daily: [
                 { $project: {
                      dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                      amount: 1,
                      type: 1,
                      isMySource: { $cond: { if: { $literal: isGlobalView }, then: true, else: { $in: ["$wallet", myWalletIds] } } },
                      isMyTarget: { $cond: { if: { $literal: isGlobalView }, then: { $gt: ["$targetWallet", null] }, else: { $in: ["$targetWallet", myWalletIds] } } }
                 }},
                 { $group: {
                      _id: "$dateStr",
                      expense: {
                          $sum: {
                              $cond: [
                                  { $or: [
                                      { $and: [{ $eq: ["$type", "EXPENSE"] }, { $eq: ["$isMySource", true] }] },
                                      { $and: [{ $eq: ["$type", "TRANSFER"] }, { $eq: ["$isMySource", true] }, { $eq: ["$isMyTarget", false] }] }
                                  ]},
                                  "$amount", 0
                              ]
                          }
                      }
                 }},
                 { $sort: { _id: 1 } }
              ]
          }
      }
  ];

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [result] = await Transaction.aggregate(categoryPipeline as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  
  const income = result.summary[0]?.income || 0;
  const expense = result.summary[0]?.expense || 0;
  const realIncome = result.summary[0]?.realIncome || 0;
  const realExpense = result.summary[0]?.realExpense || 0;
  const incomeByCategory = result.incomeByCat;
  const expenseByCategory = result.expenseByCat;
  
  // Format Daily Trend
  // Fill in gaps
  const dailyMap = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result.daily.forEach((d: any) => dailyMap.set(d._id, d.expense));
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyTrend: any[] = [];
  const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  
  if (daysDiff <= 370) {
      const { eachDayOfInterval } = await import("date-fns");
      const interval = eachDayOfInterval({ start, end });
      interval.forEach(date => {
          const key = format(date, "yyyy-MM-dd");
          const expenseVal = dailyMap.get(key) || 0;
          dailyTrend.push({ 
              date: key, 
              label: format(date, "d MMM"),
              expense: expenseVal
          });
      });
  }

  // --- HISTORICAL TREND (Last 6 Months) ---
  const sixMonthsAgo = subMonths(start, 5);
  // Separate aggregation for trend to avoid complexity in single pipeline
  // Or just execute another pipeline for speed
  
  const trendPipeline = [
       { $match: { 
           isDeleted: false, 
           date: { $gte: sixMonthsAgo, $lte: end },
           ...(myWalletIds.length > 0 ? { $or: [{ wallet: { $in: myWalletIds } }, { targetWallet: { $in: myWalletIds } }] } : {})
       }},
       { $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$date" } },
          amount: 1, type: 1, 
          isMySource: { $cond: { if: { $literal: isGlobalView }, then: true, else: { $in: ["$wallet", myWalletIds] } } },
          isMyTarget: { $cond: { if: { $literal: isGlobalView }, then: { $gt: ["$targetWallet", null] }, else: { $in: ["$targetWallet", myWalletIds] } } }
       }},
       { $group: {
           _id: "$month",
           income: { $sum: { $cond: [ { $or: [ { $and: [{ $eq: ["$type", "INCOME"] }, { $eq: ["$isMySource", true] }] }, { $and: [{ $eq: ["$type", "TRANSFER"] }, { $eq: ["$isMySource", false] }, { $eq: ["$isMyTarget", true] }] } ]}, "$amount", 0 ] } },
           expense: { $sum: { $cond: [ { $or: [ { $and: [{ $eq: ["$type", "EXPENSE"] }, { $eq: ["$isMySource", true] }] }, { $and: [{ $eq: ["$type", "TRANSFER"] }, { $eq: ["$isMySource", true] }, { $eq: ["$isMyTarget", false] }] } ]}, "$amount", 0 ] } }
       }}
  ];
  
  const trendResult = await Transaction.aggregate(trendPipeline);
  const trendMap = new Map<string, { income: number, expense: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trendResult.forEach((t: any) => trendMap.set(t._id, { income: t.income, expense: t.expense }));
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthlyTrend: any[] = [];
  for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yyyy");
      const data = trendMap.get(key) || { income: 0, expense: 0 };
      monthlyTrend.push({ name: label, ...data });
  }

  // 4. Recent Transactions (Keep as Find for population convenience, but Limit 5 is cheap)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentCriteria: any = { isDeleted: false };
  if (myWalletIds.length > 0) {
      recentCriteria.$or = [{ wallet: { $in: myWalletIds } }, { targetWallet: { $in: myWalletIds } }];
  }
  const recentTransactions = await Transaction.find(recentCriteria) 
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .populate("category wallet targetWallet")
    .populate({
        path: "relatedTransactionId",
        populate: { path: "wallet" }
    })
    .populate("createdBy", "name")
    .populate({
        path: "goalItem",
        populate: { path: "goalId", select: "name" }
    })
    .lean();
    
  // 5. Debt Stats
  const { getDebtStats } = await import("@/services/debt.service");
  const debtStats = await getDebtStats(ownerId || "ADAM");

  // 6. Active Goals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let goals: any[] = [];
  try {
      const { getGoals } = await import("@/services/goal.service");
      goals = await getGoals(ownerId);
  } catch (error) {
      console.error("Failed to fetch goals for dashboard:", error);
  }

  return {
      period: { start, end },
      summary: {
          income,
          expense,
          realIncome,
          realExpense,
          net: income - expense,
          avgDailyIncome: income / daysDiff,
          avgDailyExpense: expense / daysDiff
      },
      // @ts-ignore
      wallets: searchParams.wallets ? searchParams.wallets.map((w: any) => ({ ...w, _id: w._id.toString(), owner: w.owner.toString() })) : [],
      expenseByCategory, 
      incomeByCategory, 
      debtStats, 
      goals, 
      monthlyTrend,
      dailyTrend,
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       recentTransactions: recentTransactions.map((t: any) => ({
              ...t,
        _id: t._id.toString(),
        wallet: { name: t.wallet.name, _id: t.wallet._id.toString() },
        targetWallet: t.targetWallet ? { name: t.targetWallet.name, _id: t.targetWallet._id.toString() } : undefined,
        category: t.category ? { name: (t.category as any).name, _id: (t.category as any)._id?.toString() } : undefined,
        date: t.date.toISOString(),
        routineId: t.routineId ? t.routineId.toString() : undefined,
        createdAt: t.createdAt ? t.createdAt.toISOString() : undefined,
        updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdBy: (t.createdBy as any)?.name || (t.name as any)?.name || "Unknown",
        isTransfer: t.isTransfer,
        relatedTransaction: t.relatedTransactionId ? {
            _id: t.relatedTransactionId._id.toString(),
             
            wallet: t.relatedTransactionId.wallet ? {
                name: t.relatedTransactionId.wallet.name,
                _id: t.relatedTransactionId.wallet._id.toString()
            } : undefined
        } : undefined,
        relatedTransactionId: t.relatedTransactionId ? t.relatedTransactionId._id.toString() : undefined,
        goalItem: t.goalItem ? {
            _id: t.goalItem._id.toString(),
            name: t.goalItem.name,
            goal: t.goalItem.goalId ? {
                _id: t.goalItem.goalId._id.toString(),
                name: t.goalItem.goalId.name
            } : undefined
        } : undefined
      }))
  };
}

// Reuse similar logic for Single Wallet Analytics
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWalletAnalytics(walletId: string, searchParams: any) {
  await dbConnect();
  
  // 1. Build Date Query based on Search Params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { isDeleted: false };
  const mode = searchParams.mode || "MONTH";
  
  let start: Date, end: Date;

  if (mode === "MONTH") {
      const monthStr = searchParams.month || new Date().toISOString().slice(0, 7);
      const date = new Date(monthStr);
      start = startOfMonth(date);
      if (isSameMonth(date, new Date())) {
          end = new Date();
      } else {
          end = endOfMonth(date);
      }
      query.date = { $gte: start, $lte: end };
  } else if (mode === "RANGE") {
      start = new Date(searchParams.startDate);
      end = new Date(searchParams.endDate);
      query.date = { $gte: startOfDay(start), $lte: endOfDay(end) };
  } else {
      // All time
      const firstTxn = await Transaction.findOne({ 
          isDeleted: false,
          $or: [{ wallet: walletId }, { targetWallet: walletId }]
      }).sort({ date: 1 }).select("date").lean();
      
      start = firstTxn ? startOfMonth(firstTxn.date) : startOfMonth(new Date());
      end = new Date();
  }

  // 2. Wallet Filter (Fixed)
  query.$or = [{ wallet: walletId }, { targetWallet: walletId }];

  // 3. Other Filters
  if (searchParams.type && searchParams.type !== "ALL") {
      if (searchParams.type === "TRANSFER") {
          query.$or = [
              { type: "TRANSFER" },
              { isTransfer: true }
          ];
      } else {
          query.type = searchParams.type;
      }
  }
  if (searchParams.categoryId && searchParams.categoryId !== "ALL") query.category = searchParams.categoryId;
  if (searchParams.q) query.description = { $regex: searchParams.q, $options: "i" };
  
  if (searchParams.minAmount || searchParams.maxAmount) {
      query.amount = {};
      if (searchParams.minAmount) query.amount.$gte = Number(searchParams.minAmount);
      if (searchParams.maxAmount) query.amount.$lte = Number(searchParams.maxAmount);
  }

  // --- AGGREGATION ---
  // We need to fetch transactions to calculate summary and lists
  // Sort by date DESC, then by createdAt DESC (for same-day items)
  const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate("category wallet targetWallet")
      .populate({
        path: "relatedTransactionId",
        populate: { path: "wallet" }
      })
      .lean();

  let income = 0;
  let expense = 0;
  const expenseCategoryMap = new Map<string, number>();
  const incomeCategoryMap = new Map<string, number>();
  const dailyMap = new Map<string, { income: number, expense: number }>();

  for (const txn of transactions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tWalletId = (txn as any).wallet._id.toString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tTargetId = (txn as any).targetWallet?._id?.toString();

      const isSource = tWalletId === walletId;
      const isTarget = tTargetId === walletId;
      
      const dayKey = format(txn.date, "yyyy-MM-dd");
      if (!dailyMap.has(dayKey)) dailyMap.set(dayKey, { income: 0, expense: 0 });
      const dailyEntry = dailyMap.get(dayKey)!;

      if (txn.type === TransactionType.INCOME && isSource) {
          income += txn.amount;
          dailyEntry.income += txn.amount;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const catId = (txn.category as any)?._id?.toString() || "Uncategorized";
          incomeCategoryMap.set(catId, (incomeCategoryMap.get(catId) || 0) + txn.amount);
      } else if (txn.type === TransactionType.EXPENSE && isSource) {
          expense += txn.amount;
          dailyEntry.expense += txn.amount;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const catId = (txn.category as any)?._id?.toString() || "Uncategorized";
          expenseCategoryMap.set(catId, (expenseCategoryMap.get(catId) || 0) + txn.amount);
      } else if (txn.type === TransactionType.TRANSFER) {
          if (isSource) {
              expense += txn.amount;
              dailyEntry.expense += txn.amount;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const catId = (txn.category as any)?._id?.toString() || "Transfer Out";
              expenseCategoryMap.set(catId, (expenseCategoryMap.get(catId) || 0) + txn.amount);
          } else if (isTarget) {
              income += txn.amount;
              dailyEntry.income += txn.amount;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const catId = (txn.category as any)?._id?.toString() || "Transfer In";
              incomeCategoryMap.set(catId, (incomeCategoryMap.get(catId) || 0) + txn.amount);
          }
      }
  }

  // Categories Helper
  const getCategoryStats = async (map: Map<string, number>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stats: any[] = [];
      const keys = Array.from(map.keys());
      const validIds = keys.filter(k => k.match(/^[0-9a-fA-F]{24}$/));

      if (keys.length > 0) {
          const { default: CategoryModel } = await import("@/models/Category");
          const categories = validIds.length > 0 ? await CategoryModel.find({ _id: { $in: validIds } }).lean() : [];
          
          map.forEach((val, key) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const cat = categories.find((c: any) => c._id.toString() === key);
              const name = cat?.name || (key === "Transfer Out" ? "Transfer Out" : 
                                        key === "Transfer In" ? "Transfer In" : "Uncategorized");
              // Using actual category icon/color if available
              stats.push({ 
                  name, 
                  value: val,
                  icon: cat?.icon,
                  color: cat?.color
              });
          });
      }
      return stats.sort((a, b) => b.value - a.value);
  }

  const expenseByCategory = await getCategoryStats(expenseCategoryMap);
  const incomeByCategory = await getCategoryStats(incomeCategoryMap);

  // Trend (Last 6 Months for this wallet) - Ignore filters, just show general trend?
  // Or show trend based on filters? Usually trend is general context.
  // Let's do general 6 month trend for this specific wallet.
  const now = new Date();
  const sixMonthsAgo = subMonths(startOfMonth(now), 5);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trendQuery: any = {
      date: { $gte: sixMonthsAgo, $lte: endOfMonth(now) },
      isDeleted: false,
      $or: [{ wallet: walletId }, { targetWallet: walletId }]
  };
  const trendTransactions = await Transaction.find(trendQuery).lean();
  const trendMap = new Map<string, { income: number, expense: number }>();
  
    for (let i = 0; i < 6; i++) {
        const d = subMonths(now, i);
        const key = format(d, "MMM yyyy");
        if (!trendMap.has(key)) trendMap.set(key, { income: 0, expense: 0 });
    }

    for (const txn of trendTransactions) {
        const key = format(txn.date, "MMM yyyy");
        if (!trendMap.has(key)) trendMap.set(key, { income: 0, expense: 0 });
        const entry = trendMap.get(key)!;
        
         
        const isSource = txn.wallet.toString() === walletId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isTarget = (txn as any).targetWallet?.toString() === walletId;

        if (txn.type === TransactionType.INCOME && isSource) entry.income += txn.amount;
        else if (txn.type === TransactionType.EXPENSE && isSource) entry.expense += txn.amount;
        else if (txn.type === TransactionType.TRANSFER) {
            if (isSource) entry.expense += txn.amount;
            else if (isTarget) entry.income += txn.amount;
        }
    }
  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monthlyTrend: any[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "MMM yyyy");
        const data = trendMap.get(key) || { income: 0, expense: 0 };
        monthlyTrend.push({ name: key, ...data });
    }

    // 4. Calculate Averages & Daily Trend Array
    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dailyTrend: any[] = [];
    
    // Fill gaps if needed, or just map existing days? 
    // For a nice chart, we should ideally fill gaps, but for simplicity let's just return what we have sorted.
    // Actually, "eachDayOfInterval" is better.
    const { eachDayOfInterval } = await import("date-fns");
    
    // Safety check for very large ranges to avoid memory issues (limit to ~366 days for daily chart)
    const canGenerateDaily = daysDiff <= 370;

    if (canGenerateDaily) {
        const interval = eachDayOfInterval({ start, end });
        interval.forEach(date => {
            const key = format(date, "yyyy-MM-dd");
            const data = dailyMap.get(key) || { income: 0, expense: 0 };
            dailyTrend.push({ date: key, label: format(date, "d MMM"), ...data });
        });
    } else {
        // Fallback or aggregate by month if too large? For now just empty or limited.
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
       monthlyTrend,
       dailyTrend,
       // Serialize Transactions
        
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       transactions: transactions.map((t: any) => ({
          ...t,
          _id: t._id.toString(),
          wallet: t.wallet ? { name: t.wallet.name, _id: t.wallet._id.toString() } : { name: "Unknown Wallet", _id: "" },
          targetWallet: t.targetWallet ? { name: t.targetWallet.name, _id: t.targetWallet._id.toString() } : undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: t.category ? { name: (t.category as any).name } : undefined,
          date: t.date.toISOString(),
          
          // Fix serialization for Mongoose types
          goalItem: t.goalItem ? t.goalItem.toString() : undefined,
          routineId: t.routineId ? t.routineId.toString() : undefined,
          createdAt: t.createdAt ? t.createdAt.toISOString() : undefined,
          updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
          isTransfer: t.isTransfer,
          relatedTransaction: t.relatedTransactionId ? {
              _id: t.relatedTransactionId._id.toString(),
               
              wallet: t.relatedTransactionId.wallet ? {
                  name: t.relatedTransactionId.wallet.name,
                  _id: t.relatedTransactionId.wallet._id.toString()
              } : undefined
          } : undefined,
          relatedTransactionId: t.relatedTransactionId ? t.relatedTransactionId._id.toString() : undefined
      }))
  };
}
