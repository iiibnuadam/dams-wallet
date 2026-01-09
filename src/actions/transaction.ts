"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTransaction as createTransactionService } from "@/services/transaction.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TransactionType, PaymentPhase } from "@/types/transaction";

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional(),
  type: z.nativeEnum(TransactionType),
  wallet: z.string().min(1, "Wallet is required"),
  targetWallet: z.string().optional(), 
  category: z.string().optional(),
  adminFee: z.coerce.number().optional().default(0),
  date: z.string().or(z.date()),
  goalItem: z.string().optional(),
  paymentPhase: z.nativeEnum(PaymentPhase).optional(),
})
.refine((data) => {
    if (data.type === TransactionType.TRANSFER) {
        return !!data.targetWallet && data.targetWallet !== data.wallet;
    }
    return true;
}, {
    message: "Target wallet is required for transfer and cannot be the same as source",
    path: ["targetWallet"],
});

export async function createTransaction(prevState: unknown, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  const rawData = {
    amount: formData.get("amount"),
    description: formData.get("description")?.toString() || undefined,
    type: formData.get("type"),
    wallet: formData.get("wallet"),
    targetWallet: formData.get("targetWallet")?.toString() || undefined,
    category: formData.get("category")?.toString() || undefined,
    adminFee: formData.get("adminFee"),
    date: formData.get("date"),
    goalItem: formData.get("goalItem")?.toString() || undefined,
    paymentPhase: formData.get("paymentPhase")?.toString() || undefined,
  };

  const parsed = transactionSchema.safeParse(rawData);

  if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(i => i.message).join(", ");
      return { success: false, message: errorMessages };
  }

  const data = parsed.data;

  try {
     const transactionDate = new Date(data.date);
     const createdBy = session.user?.name || "Unknown";

     // HANDLE TRANSFER (Split into Expense + Income)
     if (data.type === TransactionType.TRANSFER) {
        if (!data.targetWallet) throw new Error("Target Wallet missing");

        // 1. Source Transaction (EXPENSE)
        const sourceData: any = {
            amount: data.amount,
            description: data.description || "Transfer Out",
            type: TransactionType.EXPENSE,
            wallet: data.wallet,
            category: data.category,
            date: transactionDate,
            createdBy,
            isTransfer: true,
            // We'll set relatedTransactionId after creating target
        };

        // 2. Target Transaction (INCOME)
        const targetData: any = {
            amount: data.amount,
            description: data.description || "Transfer In",
            type: TransactionType.INCOME,
            wallet: data.targetWallet,
            // Note: Target usually doesn't have the same category as source unless we want to link them. 
            // Often transfers are "Transfer" category or similar.
            // If user selected a category, applies to source. Target might be "Uncategorized" or same.
            // Let's keep it same for now or undefined? 
            // Ideally Income shouldn't have "Groceries" category if source was Transfer.
            // But if user selected "Transfer" category, it fits.
            category: data.category, 
            date: transactionDate,
            createdBy,
            isTransfer: true,
        };
        
        // We need to create manually to get IDs to link them.
        // Assuming createTransactionService returns the doc.
        
        // We can't do atomic transaction easily without session passing which might be complex here.
        // We'll do sequential.
        
        const sourceTx = await createTransactionService(sourceData);
        // Add source ID to target
        targetData.relatedTransactionId = sourceTx._id;
        
        const targetTx = await createTransactionService(targetData);
        
        // Update source with target ID
        // We need a updateTransactionService or just direct model call if service doesn't have update.
        // Let's import Transaction model directly here for the update to ensure linkage.
        const { default: TransactionModel } = await import("@/models/Transaction");
        await TransactionModel.findByIdAndUpdate(sourceTx._id, { relatedTransactionId: targetTx._id });
        

        // 3. Admin Fee (Separate Expense on Source) - Only if > 0
        if (data.adminFee && data.adminFee > 0) {
            const feeData: any = {
                amount: data.adminFee,
                description: `Admin Fee: ${data.description || 'Transfer'}`,
                type: TransactionType.EXPENSE,
                wallet: data.wallet,
                date: transactionDate,
                createdBy,
                category: data.category,
            };
            await createTransactionService(feeData);
        }

     } else {
         // STANDARD TRANSACTION (Income/Expense)
         const serviceData: any = {
             ...data,
             date: transactionDate,
             createdBy,
         };
         // Cleanup empty
         if (!serviceData.targetWallet) delete serviceData.targetWallet;
         if (!serviceData.category) delete serviceData.category;

         await createTransactionService(serviceData);
     }

     revalidatePath("/");
     return { success: true, message: "Transaction recorded successfully" };
  } catch (e: unknown) {
      console.error("Transaction Error:", e);
      return { success: false, message: (e as any).message || "Failed to create transaction" };
  }
}

export async function deleteTransaction(id: string) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const { default: TransactionModel } = await import("@/models/Transaction");
        const transaction = await TransactionModel.findById(id);

        if (!transaction) {
            return { success: false, message: "Transaction not found" };
        }

        // Soft delete the main transaction
        transaction.isDeleted = true;
        await transaction.save();

        // If it's a transfer, delete related transaction
        if (transaction.isTransfer && transaction.relatedTransactionId) {
            await TransactionModel.findByIdAndUpdate(transaction.relatedTransactionId, { isDeleted: true });
        }
        
        // Note: We don't verify if it successfully deleted related, assuming it exists.

        revalidatePath("/");
        // We might be on dashboard or wallet page
        revalidatePath("/wallets"); 
        // Also revalidate specific wallet pages if possible, but we don't know them easily here without checking transaction wallet ID.
        // We can access transaction.wallet and transaction.targetWallet
        if (transaction.wallet) revalidatePath(`/wallets/${transaction.wallet}`);
        if (transaction.targetWallet) revalidatePath(`/wallets/${transaction.targetWallet}`);

        return { success: true, message: "Transaction deleted successfully" };
    } catch (e) {
        console.error("Delete Transaction Error:", e);
        return { success: false, message: "Failed to delete transaction" };
    }
}

export async function fetchTransactionPage(params: any) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { success: false, message: "Unauthorized", data: [], pagination: null };
    }
    
    const currentUser = (session.user as any)?.username || session.user?.name;
    const safeParams = { ...params, currentUser };

    try {
        const { default: getTransactions } = await import("@/services/transaction.service").then(m => ({ default: m.getTransactions }));
        const result = await getTransactions(safeParams);
        return { success: true, data: result.transactions, pagination: result.pagination };
    } catch (e) {
        console.error("Fetch Transactions Error:", e);
        return { success: false, message: "Failed to fetch transactions", data: [], pagination: null };
    }
}
