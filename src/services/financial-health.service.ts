import Transaction, { TransactionType } from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import Category from "@/models/Category";
import dbConnect from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, eachMonthOfInterval, startOfDay, endOfDay, parse, startOfWeek, endOfWeek, endOfYear, differenceInDays, eachDayOfInterval, eachYearOfInterval, isSameDay, isSameMonth, isSameYear } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getFinancialHealthData(owner?: string, searchParams?: any) {
    await dbConnect();

    // Determine Date Range from Params
    let start: Date, end: Date;
    
    // Check for explicit dates first (RANGE or PRESET with dates)
    if (searchParams?.startDate && searchParams?.endDate) {
        start = new Date(searchParams.startDate);
        end = new Date(searchParams.endDate);
    } else if (searchParams?.mode === "ALL") {
        start = new Date(0); // Epoch 1970
        end = new Date();
    } else {
        // Fallback default: Current Month
        const now = new Date();
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    // 1. Helper: Identify "My Wallets"
    let myWalletIds: string[] = [];
    if (owner && owner !== "ALL") {
        const wallets = await Wallet.find({ owner }).select("_id");
        myWalletIds = wallets.map(w => w._id.toString());
    }

    const buildMatchQuery = (dateQuery: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { isDeleted: false };
        if (dateQuery) query.date = dateQuery;
        
        if (myWalletIds.length > 0) {
            query.$or = [
                { wallet: { $in: myWalletIds } },
                { targetWallet: { $in: myWalletIds } }
            ];
        }
        return query;
    };

    // 2. Intelligent Aggregation Logic
    const diffDays = differenceInDays(end, start);
    let granularity: 'day' | 'month' | 'year' = 'month';
    
    if (diffDays <= 31) granularity = 'day';
    else if (diffDays <= 730) granularity = 'month'; // Up to 2 years
    else granularity = 'year';

    // Generate Intervals
    let intervals: Date[] = [];
    try {
        if (granularity === 'day') intervals = eachDayOfInterval({ start, end });
        else if (granularity === 'month') intervals = eachMonthOfInterval({ start, end });
        else intervals = eachYearOfInterval({ start, end });
    } catch (e) {
        // Fallback if invalid interval
        intervals = [start, end];
    }
    
    // Format Label Helper
    const formatLabel = (date: Date) => {
        if (granularity === 'day') return format(date, "dd MMM");
        if (granularity === 'month') return format(date, "MMM yyyy");
        return format(date, "yyyy");
    }

    // --- A. MACRO / MICRO TREND ---
    // Unified Trend Data: Income, Expense, Net Worth over the intervals.
    
    // Get Current Net Worth (Base)
    const allWallets = owner && owner !== "ALL" ? await Wallet.find({ owner }) : await Wallet.find({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentNetWorth = allWallets.reduce((sum, w) => sum + (w.currentBalance || (w as any).initialBalance || 0), 0);
    
    // Adjust Base Net Worth if 'end' is in the past
    if (end < new Date()) {
         const futureTxns = await Transaction.find(buildMatchQuery({ 
             $gt: endOfDay(end), 
             $lte: new Date() 
         })).lean();
         
         // Reverse the effect of these transactions to get NW at 'end'
         for (const txn of futureTxns) {
             const walletId = txn.wallet?.toString() || "unknown";
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const targetWalletId = (txn as any).targetWallet?.toString();
             const isMySource = myWalletIds.length === 0 || myWalletIds.includes(walletId);
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const isMyTarget = targetWalletId && (myWalletIds.length === 0 || myWalletIds.includes(targetWalletId));

             // Reverse logic: Income adds to NW, so to go back, we subtract Income. Expense subtracts, so add.
             if (txn.type === TransactionType.INCOME && isMySource) currentNetWorth -= txn.amount;
             else if (txn.type === TransactionType.EXPENSE && isMySource) currentNetWorth += txn.amount;
             else if (txn.type === TransactionType.TRANSFER) {
                 if (isMySource && !isMyTarget) currentNetWorth += txn.amount; // Was expense, add back
                 else if (!isMySource && isMyTarget) currentNetWorth -= txn.amount; // Was income, subtract
             }
         }
    }

    // Fetch Transactions for the Interval
    const trendTransactions = await Transaction.find(buildMatchQuery({ 
        $gte: startOfDay(start), 
        $lte: endOfDay(end) 
    })).sort({ date: -1 }).lean(); // Newest first

    // Map transactions to intervals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intervalMap = new Map<string, { income: number, expense: number }>();
    intervals.forEach(d => {
        intervalMap.set(formatLabel(d), { income: 0, expense: 0 });
    });

    // Populate Map
    for (const txn of trendTransactions) {
        // Find matching interval
        // Since we iterate generic transactions, we need to match date to label
        let label = "";
        if (granularity === 'day') label = format(txn.date, "dd MMM");
        else if (granularity === 'month') label = format(txn.date, "MMM yyyy");
        else label = format(txn.date, "yyyy");
        
        if (intervalMap.has(label)) {
             const entry = intervalMap.get(label)!;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const walletId = (txn.wallet as any)?._id?.toString() || txn.wallet?.toString() || "unknown";
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const targetWalletId = (txn as any).targetWallet?.toString();
             const isMySource = myWalletIds.length === 0 || myWalletIds.includes(walletId);
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const isMyTarget = targetWalletId && (myWalletIds.length === 0 || myWalletIds.includes(targetWalletId));

             if (txn.type === TransactionType.INCOME && isMySource) entry.income += txn.amount;
             else if (txn.type === TransactionType.EXPENSE && isMySource) entry.expense += txn.amount;
             else if (txn.type === TransactionType.TRANSFER) {
                 if (isMySource && !isMyTarget) entry.expense += txn.amount;
                 else if (!isMySource && isMyTarget) entry.income += txn.amount;
             }
        }
    }

    // Build Final Trend Array (Backwards from End)
    // We already have 'currentNetWorth' at 'end'.
    // We need to walk backwards through intervals.
    // Interval[Last] NW = currentNetWorth.
    // Interval[Last-1] NW = Interval[Last] NW - (Interval[Last].Income - Interval[Last].Expense)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trendData: any[] = [];
    let runningNW = currentNetWorth;
    
    const reversedIntervals = [...intervals].reverse();
    
    for (const date of reversedIntervals) {
        const label = formatLabel(date);
        const flow = intervalMap.get(label) || { income: 0, expense: 0 };
        const change = flow.income - flow.expense;
        
        // This 'runningNW' represents the NW at the END of this interval.
        // So we push it effectively.
        trendData.push({
            date: date.toISOString(),
            label,
            netWorth: runningNW,
            income: flow.income,
            expense: flow.expense,
            cashFlow: change
        });
        
        // Prepare NW for the previous interval (older time)
        runningNW -= change;
    }
    
    trendData.reverse(); // Now ordered Start -> End

    // --- B. SPENDING BEHAVIOR: Sankey Data ---
    // Use the filtered 'start' and 'end'
    const currentTxns = await Transaction.find(buildMatchQuery({ $gte: startOfDay(start), $lte: endOfDay(end) }))
        .populate("category wallet")
        .lean();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sankeyLinks: { source: string; target: string; value: number }[] = [];
    const sankeyNodes = new Set<string>();

    const walletIncomeMap = new Map<string, number>(); // WalletName -> Total Income Received
    
    for (const txn of currentTxns) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wName = (txn.wallet as any)?.name || "Unknown Wallet";
        
        if (txn.type === TransactionType.INCOME) {
            // Source: "Salary" or "Income" -> Wallet
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const catName = (txn.category as any)?.name || "Other Income";
            const source = `${catName} (In)`;
            
            sankeyLinks.push({ source, target: wName, value: txn.amount });
            sankeyNodes.add(source);
            sankeyNodes.add(wName);
            
            walletIncomeMap.set(wName, (walletIncomeMap.get(wName) || 0) + txn.amount);
        } else if (txn.type === TransactionType.EXPENSE) {
            // Wallet -> Category
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const catName = (txn.category as any)?.name || "Uncategorized";
            
            sankeyLinks.push({ source: wName, target: catName, value: txn.amount });
            sankeyNodes.add(wName);
            sankeyNodes.add(catName);
        }
    }
    
    // Aggregate duplicate links
    const aggregatedLinks: typeof sankeyLinks = [];
    const linkMap = new Map<string, number>();
    
    sankeyLinks.forEach(link => {
        const key = `${link.source}->${link.target}`;
        linkMap.set(key, (linkMap.get(key) || 0) + link.value);
    });
    
    linkMap.forEach((val, key) => {
        const [source, target] = key.split("->");
        aggregatedLinks.push({ source, target, value: val });
    });


    // --- C. FIXED vs VARIABLE Ratio ---
    // Based on current month expenses
    let fixedTotal = 0;
    let variableTotal = 0;

    for (const txn of currentTxns) {
        if (txn.type === TransactionType.EXPENSE) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const flexibility = (txn.category as any)?.flexibility || "VARIABLE";
            if (flexibility === "FIXED") fixedTotal += txn.amount;
            else variableTotal += txn.amount;
        }
    }
    
    // --- D. COUPLE DYNAMICS: Contribution Radar ---
    const ownerContributionMap = new Map<string, Map<string, number>>(); // Owner -> { Category -> Amount }
    
    currentTxns.forEach(txn => {
        if (txn.type === TransactionType.EXPENSE) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const wOwner = (txn.wallet as any)?.owner || "Unknown";
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const catName = (txn.category as any)?.name || "Other";
            
            if (!ownerContributionMap.has(wOwner)) ownerContributionMap.set(wOwner, new Map());
            const catMap = ownerContributionMap.get(wOwner)!;
            catMap.set(catName, (catMap.get(catName) || 0) + txn.amount);
        }
    });

    const categoriesList = Array.from(new Set(currentTxns.map(t => 
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t.category as any)?.name || "Other"
    )));
    
    const owners = Array.from(ownerContributionMap.keys());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const radarData = categoriesList.slice(0, 6).map(cat => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = { subject: cat };
        owners.forEach(o => {
            obj[o] = ownerContributionMap.get(o)?.get(cat) || 0;
        });
        return obj;
    });


    // --- E. FORECASTING: Freedom Date (Project/Debt) ---
    const liabilityWallets = await Wallet.find({ 
        "liabilityDetails.tenorMonths": { $exists: true, $gt: 0 },
        isDeleted: false
    });
    
    const liabilities = liabilityWallets.map(w => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const start = (w as any).liabilityDetails?.startDate || new Date();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tenor = (w as any).liabilityDetails?.tenorMonths || 0;
        
        // Months passed
        const diffTime = Math.abs(new Date().getTime() - new Date(start).getTime());
        const monthsPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); 
        const monthsLeft = Math.max(0, tenor - monthsPassed);
        
        return {
            name: w.name,
            totalMonths: tenor,
            monthsPassed,
            monthsLeft,
            progress: Math.min(100, (monthsPassed / tenor) * 100)
        };
    });

    // --- F. AI INSIGHTS GENERATION ---
    const insights: { title: string; value: string; message: string; status: 'positive' | 'warning' | 'neutral' }[] = [];
    
    const totalIncome = trendData.reduce((sum: number, t: any) => sum + t.income, 0);
    const totalExpense = trendData.reduce((sum: number, t: any) => sum + t.expense, 0);
    const cashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (cashFlow / totalIncome) * 100 : 0;

    if (granularity === 'day') {
        // MICRO VIEW
        const avgDailyExpense = totalExpense / (trendData.length || 1);
        insights.push({
            title: "Daily Burn Rate",
            value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(avgDailyExpense),
            message: `You are spending average of ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(avgDailyExpense)} / day during this period.`,
            status: avgDailyExpense > 500000 ? 'warning' : 'neutral' // Threshold example
        });

        if (cashFlow < 0) {
             insights.push({
                title: "Short-term Deficit",
                value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Math.abs(cashFlow)),
                message: "Expenses exceeded income in this period.",
                status: 'warning'
             });
        } else {
             insights.push({
                title: "Short-term Surplus",
                value: "+ " + new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(cashFlow),
                message: "You managed to stay positive this week.",
                status: 'positive'
             });
        }
    } else if (granularity === 'month') {
        // STANDARD VIEW
        insights.push({
            title: "Savings Rate",
            value: savingsRate.toFixed(1) + "%",
            message: savingsRate > 20 
                ? "Excellent! You're saving consistently above 20%." 
                : savingsRate > 0 
                ? "You're saving, but aim for 20% to build wealth faster." 
                : "You spent more than you earned.",
            status: savingsRate > 20 ? 'positive' : savingsRate > 0 ? 'neutral' : 'warning'
        });

        const fixedRatio = (fixedTotal + variableTotal) > 0 ? (fixedTotal / (fixedTotal + variableTotal)) * 100 : 0;
        insights.push({
            title: "Fixed Cost Burden",
            value: fixedRatio.toFixed(0) + "%",
            message: fixedRatio > 60 
                ? "High fixed costs (>60%) limits your flexibility." 
                : "Your fixed costs are at a healthy manageable level.",
            status: fixedRatio > 60 ? 'warning' : 'positive'
        });

        // BORROWING POWER (DTI Insight)
        // Assumption: Safe Debt Service Ratio is 30% of Gross Income.
        // We use 'fixedTotal' as a proxy for mandatory obligations if we can't distinguish explicit debt.
        // Or strictly use 30% - (Fixed Expenses that are Debts).
        // For safety, let's use: Borrowing Power = (Income * 30%) - Existing Fixed Costs. (Very conservative)
        // Less conservative: Borrowing Power = (Income * 35%) - Fixed Costs.
        const safeDebtRatio = 0.35; // 35% DTI
        const maxSafeInstallment = totalIncome * safeDebtRatio;
        const availableCapacity = maxSafeInstallment - fixedTotal; // Assuming Fixed Expenses include existing debts
        
        if (totalIncome > 0) {
             insights.push({
                title: "Borrowing Power",
                value: availableCapacity > 0 
                    ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(availableCapacity) + " /mo"
                    : "Maxed Out",
                message: availableCapacity > 0 
                    ? "Safe monthly installment limit for new loans (35% DTI)."
                    : "You exceeded the safe debt/fixed cost limit. Avoid new loans.",
                status: availableCapacity > 0 ? 'positive' : 'warning'
             });
        }

    } else {
        // MACRO VIEW (Year)
        const startNW = trendData[0]?.netWorth || 0;
        const endNW = trendData[trendData.length - 1]?.netWorth || 0;
        const growth = endNW - startNW;
        const growthPercent = startNW !== 0 ? (growth / startNW) * 100 : 0;

        insights.push({
            title: "Net Worth Growth",
            value: (growth >= 0 ? "+" : "") + growthPercent.toFixed(1) + "%",
            message: growth >= 0 
                ? `Your wealth grew by ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact" }).format(growth)} in this period.`
                : "Your net worth decreased. Check major liabilities or expenses.",
            status: growth >= 0 ? 'positive' : 'warning'
        });

        insights.push({
            title: "Total Accumulation",
            value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact" }).format(cashFlow),
            message: cashFlow > 0 
                ? "Total cash retained after expenses."
                : "Total capital depleted.",
            status: cashFlow > 0 ? 'positive' : 'warning'
        });
    }

    return {
        trend: trendData, // Universal unified trend
        granularity,
        insights,
        macroStats: {
            currentNetWorth, // This is explicitly the NW at the END of the period
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            totalIncome: trendData.reduce((sum: number, t: any) => sum + t.income, 0),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            totalExpense: trendData.reduce((sum: number, t: any) => sum + t.expense, 0),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            savingsRate: (trendData.reduce((sum: number, t: any) => sum + t.income, 0) > 0 ? 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((trendData.reduce((sum: number, t: any) => sum + t.income, 0) - trendData.reduce((sum: number, t: any) => sum + t.expense, 0)) / trendData.reduce((sum: number, t: any) => sum + t.income, 0)) * 100 
                : 0)
        },
        sankeyData: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nodes: Array.from(sankeyNodes).map(name => ({ name })),
            links: aggregatedLinks
        },
        fixedVsVariable: {
            fixed: fixedTotal,
            variable: variableTotal,
            ratio: (fixedTotal + variableTotal) > 0 ? (fixedTotal / (fixedTotal + variableTotal)) * 100 : 0
        },
        radarData,
        liabilities
    };
}
