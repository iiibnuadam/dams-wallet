import Transaction, { TransactionType } from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import dbConnect from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format, getDate, startOfDay, endOfDay, startOfWeek, endOfWeek, parse, startOfYear, endOfYear, isSameMonth } from "date-fns";
import "@/models/GoalItem"; // Register GoalItem schema
import "@/models/Goal"; // Register Goal schema
import { WalletOwner } from "@/types/wallet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDashboardData(owner?: string, searchParams?: any) {
  await dbConnect();
  
  let start: Date, end: Date;
  
  // Parse Search Params if provided
  if (searchParams?.mode === "RANGE" && searchParams.startDate && searchParams.endDate) {
      start = startOfDay(new Date(searchParams.startDate));
      end = endOfDay(new Date(searchParams.endDate));
  } else if (searchParams?.mode === "WEEK" && searchParams.week) {
      // Format: "2024-W05"
      const date = parse(searchParams.week, "RRRR-'W'II", new Date(), { weekStartsOn: 1 });
      start = startOfWeek(date, { weekStartsOn: 1 });
      end = endOfWeek(date, { weekStartsOn: 1 });
  } else if (searchParams?.mode === "MONTH" && searchParams.month) {
      const date = new Date(searchParams.month);
      start = startOfDay(startOfMonth(date)); // Ensure full day coverage
      if (isSameMonth(date, new Date())) {
          end = new Date(); // MTD for current month
      } else {
          end = endOfDay(endOfMonth(date));
      }
  } else if (searchParams?.mode === "YEAR" && searchParams.year) {
      const date = parse(searchParams.year, "yyyy", new Date());
      start = startOfYear(date);
      end = endOfYear(date);
  } else if (searchParams?.mode === "ALL") {
      // Find first transaction date
      const firstTxn = await Transaction.findOne({ isDeleted: false }).sort({ date: 1 }).select("date").lean();
      start = firstTxn ? startOfMonth(firstTxn.date) : startOfMonth(new Date());
      end = new Date(); // Now
  } else {
      // Default: Last 3 Months
      const now = new Date();
      start = startOfMonth(subMonths(now, 3)); 
      end = now; 
  }
  
  const now = new Date(); // Keep 'now' for trends relative to current time if needed, or maybe trends should respect range?
  // User asked for report: usually report respects the filter.
  // Trends (daily/monthly) should probably respect the filtered range if reasonable.


  // 1. Identify "My Wallets" if owner is specified
  let myWalletIds: string[] = [];
  let ownerId = owner; // Default to incoming (might be ID if updated elsewhere, but currently username)

  if (owner && owner !== "ALL") {
      // Resolve owner username to ID
      const { default: User } = await import("@/models/User");
      // Use regex for case-insensitive matching
      const user = await User.findOne({ username: { $regex: new RegExp(`^${owner}$`, "i") } }).select("_id");
      
      if (user) {
          ownerId = user._id.toString();
          const wallets = await Wallet.find({ owner: ownerId }).select("_id");
          myWalletIds = wallets.map(w => w._id.toString());
      }
  } else if (!owner || owner === "ALL") {
       // Default to ADAM for debts if ALL? Or show all debts? 
       // Logic at line 261 was: owner || "ADAM". 
       // So if ALL, it used "ADAM".
       // Let's resolve "ADAM" ID.
       const { default: User } = await import("@/models/User");
       // Use regex for case-insensitive matching for default user too
       const defaultUser = await User.findOne({ username: { $regex: new RegExp("^ADAM$", "i") } }).select("_id");
       if (defaultUser) ownerId = defaultUser._id.toString();
  }

  const buildMatchQuery = (dateQuery: any) => {
    const query: any = {
        isDeleted: false,
    };

    if (dateQuery && Object.keys(dateQuery).length > 0) {
        query.date = dateQuery;
    }

    if (myWalletIds.length > 0) {
        query.$or = [
            { wallet: { $in: myWalletIds } },
            { targetWallet: { $in: myWalletIds } }
        ];
    }
    return query;
  };

  // --- CURRENT MONTH DATA ---
  const currentMonthQuery = buildMatchQuery({ $gte: start, $lte: end });
  const transactions = await Transaction.find(currentMonthQuery)
    .populate({
        path: "relatedTransactionId",
        populate: { path: "wallet" }
    })
    .lean();

  let income = 0;
  let expense = 0;
  const expenseCategoryMap = new Map<string, number>();
  const incomeCategoryMap = new Map<string, number>();
  const dailyMap = new Map<string, number>(); 

  for (const txn of transactions) {
      const walletId = txn.wallet.toString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetWalletId = (txn as any).targetWallet?.toString();
      const dayKey = format(txn.date, "yyyy-MM-dd");
      
      const isMySource = myWalletIds.length === 0 || myWalletIds.includes(walletId);
      const isMyTarget = targetWalletId && (myWalletIds.length === 0 || myWalletIds.includes(targetWalletId));

      let txnExpense = 0;

      if (myWalletIds.length > 0) {
          if (txn.type === TransactionType.INCOME) {
              if (isMySource) {
                  income += txn.amount;
                  const catId = txn.category?.toString() || "Uncategorized";
                  incomeCategoryMap.set(catId, (incomeCategoryMap.get(catId) || 0) + txn.amount);
              }
          } else if (txn.type === TransactionType.EXPENSE) {
             if (isMySource) {
                 txnExpense = txn.amount;
                 expense += txn.amount;
                 const catId = txn.category?.toString() || "Uncategorized";
                 expenseCategoryMap.set(catId, (expenseCategoryMap.get(catId) || 0) + txn.amount);
             }
          } else if (txn.type === TransactionType.TRANSFER) {
              if (isMySource && !isMyTarget) {
                  txnExpense = txn.amount;
                  expense += txn.amount;
                  const catId = txn.category?.toString() || "Transfer Out"; 
                  expenseCategoryMap.set(catId, (expenseCategoryMap.get(catId) || 0) + txn.amount);
              } else if (!isMySource && isMyTarget) {
                  income += txn.amount;
                  const catId = txn.category?.toString() || "Transfer In"; 
                  incomeCategoryMap.set(catId, (incomeCategoryMap.get(catId) || 0) + txn.amount);
              }
          }
      } else {
          // Global View
          if (txn.type === TransactionType.INCOME) {
              income += txn.amount;
              const catId = txn.category?.toString() || "Uncategorized";
              incomeCategoryMap.set(catId, (incomeCategoryMap.get(catId) || 0) + txn.amount);
          }
          if (txn.type === TransactionType.EXPENSE) {
              txnExpense = txn.amount;
              expense += txn.amount;
              const catId = txn.category?.toString() || "Uncategorized";
              expenseCategoryMap.set(catId, (expenseCategoryMap.get(catId) || 0) + txn.amount);
          }
      }

      if (txnExpense > 0) {
          dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + txnExpense);
      }
  }

  // --- HISTORICAL TREND (Last 6 Months) ---
  const sixMonthsAgo = subMonths(start, 5);
  const trendQuery = buildMatchQuery({ $gte: sixMonthsAgo, $lte: end });
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

      const walletId = txn.wallet.toString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetWalletId = (txn as any).targetWallet?.toString();
      const isMySource = myWalletIds.length === 0 || myWalletIds.includes(walletId);
      const isMyTarget = targetWalletId && (myWalletIds.length === 0 || myWalletIds.includes(targetWalletId));

      if (myWalletIds.length > 0) {
          if (txn.type === TransactionType.INCOME && isMySource) entry.income += txn.amount;
          else if (txn.type === TransactionType.EXPENSE && isMySource) entry.expense += txn.amount;
          else if (txn.type === TransactionType.TRANSFER) {
              if (isMySource && !isMyTarget) entry.expense += txn.amount;
              else if (!isMySource && isMyTarget) entry.income += txn.amount;
          }
      } else {
          if (txn.type === TransactionType.INCOME) entry.income += txn.amount;
          else if (txn.type === TransactionType.EXPENSE) entry.expense += txn.amount;
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
              stats.push({ name, value: val });
          });
      }
      return stats.sort((a, b) => b.value - a.value);
  }

  const expenseByCategory = await getCategoryStats(expenseCategoryMap);
  const incomeByCategory = await getCategoryStats(incomeCategoryMap);

  // 2. Trend Stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthlyTrend: any[] = [];
  for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "MMM yyyy");
      const data = trendMap.get(key) || { income: 0, expense: 0 };
      monthlyTrend.push({ name: key, ...data });
  }

  // 3. Daily Trend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyTrend: any[] = [];
  
  // Use date-fns to generate all days in interval
  const { eachDayOfInterval } = await import("date-fns");
  
  // Safety check for very large ranges
  const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  
  if (daysDiff <= 370) {
      const interval = eachDayOfInterval({ start, end });
      interval.forEach(date => {
          const key = format(date, "yyyy-MM-dd");
          const expense = dailyMap.get(key) || 0;
          dailyTrend.push({ 
              date: key, 
              label: format(date, "d MMM"), // "1 Jan"
              expense 
          });
      });
  } else {
      // Too many days, maybe aggregate? For now just return empty to prevent crash
      // or implement monthly view later.
  }

  // 4. Recent Transactions
  const recentTransactions = await Transaction.find(buildMatchQuery({})) 
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
  // Assuming owner logic is same as wallets - if owner specific, get that owner's debts. 
  // If global (ADAM), get ADAM's debts? 
  // The dashboard `owner` param is reliable.
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
          net: income - expense
      },
      expenseByCategory, // Keep existing name for backward compat if needed, or update consumers
      incomeByCategory, // New field
      debtStats, // New debt stats
      goals, // New goals field
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export async function getWalletAnalytics(walletId: string, searchParams: any) {
  await dbConnect();
  
  // 1. Build Date Query based on Search Params
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
              stats.push({ name, value: val });
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
  const trendQuery = {
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              wallet: t.relatedTransactionId.wallet ? {
                  name: t.relatedTransactionId.wallet.name,
                  _id: t.relatedTransactionId.wallet._id.toString()
              } : undefined
          } : undefined,
          relatedTransactionId: t.relatedTransactionId ? t.relatedTransactionId._id.toString() : undefined
      }))
  };
}
