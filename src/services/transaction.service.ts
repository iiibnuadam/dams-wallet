import Transaction, { ITransaction, TransactionType } from "../models/Transaction";
import Wallet from "../models/Wallet";
import dbConnect from "../lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, parse } from "date-fns";
import { Types } from "mongoose";
import "@/models/GoalItem"; // Register GoalItem schema
import "@/models/Goal"; // Register Goal schema
import "@/models/Category"; // Register Category schema
import "@/models/User"; // Register User schema
import "@/models/Wallet"; // Register Wallet schema
import "@/models/Routine"; // Register Routine schema

export async function createTransaction(data: Partial<ITransaction>) {
  await dbConnect();

  if (data.type === TransactionType.TRANSFER) {
    if (!data.targetWallet) {
      throw new Error("Target Wallet is required for TRANSFER transaction");
    }
    if (data.wallet === data.targetWallet) {
        throw new Error("Source and Target Wallet cannot be the same");
    }
    // Validate existence
    const target = await Wallet.findById(data.targetWallet);
    if (!target) {
        throw new Error("Target Wallet not found");
    }
  }

  // --- Automatic 'Goals' Categorization ---
  // If transaction is linked to a goal item, force category to "Goals"
  if (data.goalItem) {
      const { default: Category, CategoryType } = await import("../models/Category");
      let goalCategory = await Category.findOne({ name: "Goals", type: CategoryType.EXPENSE, isDeleted: false });
      
      if (!goalCategory) {
          goalCategory = await Category.create({
              name: "Goals",
              type: CategoryType.EXPENSE,
              flexibility: "FIXED" 
          });
      }
      
      if (goalCategory) {
          data.category = goalCategory._id as any;
      }
  }

  // --- Automatic 'Admin Fee' Categorization ---
  // If description indicates Admin Fee, force category to "Admin Fee"
  if (data.description && data.description.toLowerCase().includes("admin fee")) {
      const { default: Category, CategoryType } = await import("../models/Category");
      let feeCategory = await Category.findOne({ name: "Admin Fee", type: CategoryType.EXPENSE, isDeleted: false });
      
      if (!feeCategory) {
          feeCategory = await Category.create({
              name: "Admin Fee",
              type: CategoryType.EXPENSE,
              flexibility: "FIXED"
          });
      }
      
      if (feeCategory) {
          data.category = feeCategory._id as any;
      }
  }


  const transaction = await Transaction.create(data);
  return transaction;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTransactions(params: any) {
    await dbConnect();

    // --- Build Query ---
    const query: any = { isDeleted: false };
    
    // 1. Date Filter
    const mode = params.mode || "MONTH";
    
    if (mode === "MONTH") {
        const monthStr = params.month || new Date().toISOString().slice(0, 7); // yyyy-MM
        const date = parse(monthStr, "yyyy-MM", new Date());
        query.date = {
            $gte: startOfMonth(date),
            $lte: endOfMonth(date)
        };
    } else if (mode === "RANGE") {
        if (params.startDate && params.endDate) {
            query.date = {
                $gte: startOfDay(new Date(params.startDate)),
                $lte: endOfDay(new Date(params.endDate))
            };
        }
    }
    // mode === "ALL" -> No date filter

    // 2. Type Filter
    if (params.type && params.type !== "ALL") {
        if (params.type === "TRANSFER") {
            query.$or = [
                { type: "TRANSFER" },
                { isTransfer: true }
            ];
        } else if (params.type === "GOAL") {
            query.goalItem = { $exists: true, $ne: null };
        } else {
            query.type = params.type;
        }
    }

    // 3. Wallet Filter
    if (params.walletId && params.walletId !== "ALL") {
        query.$or = [
            { wallet: new Types.ObjectId(params.walletId) },
            { targetWallet: new Types.ObjectId(params.walletId) }
        ];
    }

    // 4. Category Filter
    if (params.categoryId && params.categoryId !== "ALL") {
        let catIds: string[] = [];
        if (Array.isArray(params.categoryId)) {
             // If somehow passed as array
             catIds = params.categoryId.map((s: any) => String(s).trim());
        } else if (typeof params.categoryId === 'string') {
             // Comma separated string
             catIds = params.categoryId.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        }

        if (catIds.length > 0) {
            query.category = { $in: catIds.map(id => new Types.ObjectId(id)) };
        }
    }

    // 5. Search Filter (Description)
    if (params.q) {
        query.description = { $regex: params.q, $options: "i" };
    }

    // 6. Amount Filter
    if (params.minAmount || params.maxAmount) {
        query.amount = {};
        if (params.minAmount) query.amount.$gte = Number(params.minAmount);
        if (params.maxAmount) query.amount.$lte = Number(params.maxAmount);
    }

    // 7. Goal Filter
    if (params.goalId && params.goalId !== "ALL") {
         // Find all items for this goal
         const { default: GoalItem } = await import("../models/GoalItem");
         const items = await GoalItem.find({ goalId: params.goalId }).select("_id");
         const itemIds = items.map(i => i._id);
         query.goalItem = { $in: itemIds };
    }

    // 7. User Filter (Wallet Ownership)
    // Supports explicit 'view' (username) or legacy 'userFilter' (ME/OTHERS)
    const view = params.view || params.owner;
    
    if (view && view !== "ALL") {
         const { default: User } = await import("../models/User");
         const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${view}$`, "i") } });
         
         if (targetUser) {
             const targetWallets = await Wallet.find({ owner: targetUser._id, isDeleted: false } as any).select("_id");
             const walletIds = targetWallets.map(w => w._id);
             query.wallet = { $in: walletIds }; // walletIds are typically ObjectIds from find
         }
    } else if (view === "ALL") {
        const { default: User } = await import("@/models/User");
        // Explicitly fetch distinct IDs for ADAM an SASTI to be safe, or just don't filter if we want everything
        // But to match specific requested users:
        const users = await User.find({ username: { $in: ["ADAM", "SASTI"] } }).select("_id");
        if (users.length > 0) {
            const userIds = users.map(u => u._id);
            const targetWallets = await Wallet.find({ owner: { $in: userIds }, isDeleted: false } as any).select("_id");
            query.wallet = { $in: targetWallets.map(w => w._id) };
        }
    } else {
        // Legacy "ME / OTHERS" fallback if no specific view provided
        const currentUser = params.currentUser;
        const userFilter = params.userFilter || "ME"; 
    
        if (currentUser && userFilter !== "ALL") {
            // Find wallets owned by current user
            const wallets = await Wallet.find({ owner: currentUser }).select("_id");
            const myWalletIds = wallets.map(w => w._id);
    
            if (userFilter === "ME") {
                // Transactions where the primary wallet is owned by me
                query.wallet = { $in: myWalletIds };
            } else if (userFilter === "OTHERS") {
                // Transactions where the primary wallet is NOT owned by me
                query.wallet = { $nin: myWalletIds };
            }
        }
    }

    // --- Pagination ---
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 15;
    const skip = (page - 1) * limit;

    // --- Summary Aggregation ---
    // Efficiently calculate totals for the current filter
    // We use facet to get both overall totals and category breakdown
    const summaryAggregation = await Transaction.aggregate([
        { $match: query },
        {
            $facet: {
                "totals": [
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
                        $addFields: {
                            groupKey: {
                                $cond: [
                                    { $ifNull: ["$goalItem", false] },
                                    "GOAL",
                                    "$category"
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { key: "$groupKey", type: "$type" },
                            total: { $sum: "$amount" }
                        }
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "_id.key",
                            foreignField: "_id",
                            as: "categoryDoc"
                        }
                    },
                    {
                        $project: {
                            type: "$_id.type",
                            categoryName: {
                                $cond: [
                                    { $eq: ["$_id.key", "GOAL"] },
                                    "Goals",
                                    { $arrayElemAt: ["$categoryDoc.name", 0] }
                                ]
                            },
                             // Use hardcoded color/icon for Goals if needed, or rely on frontend utils
                            categoryColor: { $arrayElemAt: ["$categoryDoc.color", 0] },
                            categoryIcon: { $arrayElemAt: ["$categoryDoc.icon", 0] },
                            total: 1
                        }
                    },
                    { $sort: { total: -1 } }
                ]
            }
        }
    ]);
    
    // Process Aggregation Result
    const totals = summaryAggregation[0].totals[0] || { totalIncome: 0, totalExpense: 0 };
    const byCategory = summaryAggregation[0].byCategory || [];

    const summary = {
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        net: totals.totalIncome - totals.totalExpense,
        // Detailed breakdown
        incomeCategories: byCategory.filter((c: any) => c.type === "INCOME").map((c: any) => ({
             name: c.categoryName || "Uncategorized",
             value: c.total,
             color: c.categoryColor,
             icon: c.categoryIcon
        })),
        expenseCategories: byCategory.filter((c: any) => c.type === "EXPENSE").map((c: any) => ({
             name: c.categoryName || "Uncategorized",
             value: c.total,
             color: c.categoryColor,
             icon: c.categoryIcon
        }))
    };


    // --- Fetch Data ---
    // If summaryOnly is requested, skip fetching the list
    if (params.summaryOnly) {
         return {
            transactions: [],
            pagination: {
                currentPage: page,
                totalPages: 0,
                totalItems: 0,
                limit
            },
            summary
        };
    }

    const [transactions, totalItems] = await Promise.all([
        Transaction.find(query)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
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
            .lean(),
        Transaction.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    // Serialize
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedTransactions = transactions.map((t: any) => ({
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
    }));

    return {
        transactions: serializedTransactions,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            limit
        },
        summary
    };
}
