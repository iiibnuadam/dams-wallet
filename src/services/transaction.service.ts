import Transaction, { ITransaction, TransactionType } from "../models/Transaction";
import Wallet from "../models/Wallet";
import dbConnect from "../lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, parse } from "date-fns";
import "@/models/GoalItem"; // Register GoalItem schema
import "@/models/Goal"; // Register Goal schema

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
            { wallet: params.walletId },
            { targetWallet: params.walletId }
        ];
    }

    // 4. Category Filter
    if (params.categoryId && params.categoryId !== "ALL") {
        query.category = params.categoryId;
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
    const currentUser = params.currentUser;
    const userFilter = params.userFilter || "ME"; 

    if (currentUser) {
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
        // ALL = no filter
    }

    // --- Pagination ---
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 15;
    const skip = (page - 1) * limit;

    // --- Fetch Data ---
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
        }
    };
}
