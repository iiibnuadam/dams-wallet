"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createGoal, updateGoal, deleteGoal } from "@/services/goal.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetDate: z.string().or(z.date()),
  visibility: z.enum(["PRIVATE", "SHARED"]),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function createGoalAction(prevState: unknown, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const rawData = {
        name: formData.get("name"),
        targetDate: formData.get("targetDate"),
        visibility: formData.get("visibility"),
        color: formData.get("color"),
        icon: formData.get("icon"),
    };

    const parsed = goalSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues.map(i => i.message).join(", ") };
    }

    try {
        await createGoal({
            ...parsed.data,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            owner: (session.user as any).id, 
            targetDate: new Date(parsed.data.targetDate),
        });
        revalidatePath("/goals");
        return { success: true, message: "Goal created successfully" };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to create goal" };
    }
}

export async function updateGoalAction(id: string, prevState: unknown, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const rawData = {
        name: formData.get("name"),
        targetDate: formData.get("targetDate"),
        visibility: formData.get("visibility"),
        color: formData.get("color"),
        icon: formData.get("icon"),
    };

    const parsed = goalSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues.map(i => i.message).join(", ") };
    }

    try {
        await updateGoal(id, {
            ...parsed.data,
            targetDate: new Date(parsed.data.targetDate),
        });
        revalidatePath(`/goals`);
        revalidatePath(`/goals/${id}`);
        return { success: true, message: "Goal updated successfully" };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to update goal" };
    }
}

export async function deleteGoalAction(id: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await deleteGoal(id);
        revalidatePath("/goals");
        return { success: true, message: "Goal deleted successfully" };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to delete goal" };
    }
}

// --- Goal Item Actions ---

import { createGoalItem, updateGoalItem, deleteGoalItem } from "@/services/goal.service";

const goalItemSchema = z.object({
  goalId: z.string().min(1, "Goal ID is required"),
  groupName: z.string().min(1, "Group Name is required"),
  name: z.string().min(1, "Name is required"),
  estimatedAmount: z.coerce.number().min(0, "Amount must be positive"),
});

export async function createGoalItemAction(prevState: unknown, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const rawData = {
        goalId: formData.get("goalId"),
        groupName: formData.get("groupName"),
        name: formData.get("name"),
        estimatedAmount: formData.get("estimatedAmount"),
    };

    const parsed = goalItemSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues.map(i => i.message).join(", ") };
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createGoalItem(parsed.data as any);
        revalidatePath(`/goals/${parsed.data.goalId}`);
        return { success: true, message: "Item added successfully" };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to add item" };
    }
}

export async function updateGoalItemAction(id: string, goalId: string, prevState: unknown, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const rawData = {
        goalId: goalId, // passed explicitly or from form, used for validation
        groupName: formData.get("groupName"),
        name: formData.get("name"),
        estimatedAmount: formData.get("estimatedAmount"),
    };

    const parsed = goalItemSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues.map(i => i.message).join(", ") };
    }

    try {
        await updateGoalItem(id, {
            groupName: parsed.data.groupName,
            name: parsed.data.name,
            estimatedAmount: parsed.data.estimatedAmount,
        });
        revalidatePath(`/goals/${goalId}`);
        return { success: true, message: "Item updated successfully" };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to update item" };
    }
}

export async function deleteGoalItemAction(id: string, goalId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await deleteGoalItem(id);
        revalidatePath(`/goals/${goalId}`);
        return { success: true, message: "Item deleted successfully" };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to delete item" };
    }
}

export async function updateGroupStyleAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const goalId = formData.get("goalId") as string;
    const groupName = formData.get("groupName") as string;
    const color = formData.get("color") as string;
    const icon = formData.get("icon") as string;

    if (!goalId || !groupName) return { success: false, message: "Missing required fields" };

    try {
        await upsertGroupStyle(goalId, { name: groupName, color, icon });
        revalidatePath(`/goals/${goalId}`);
        return { success: true, message: "Group style updated" };
    } catch (e: any) {
        return { success: false, message: e.message || "Failed to update group style" };
    }
}

import { upsertGroupStyle } from "@/services/goal.service";


// We need to import Transaction model to use it in deleteGoalPaymentAction
// It seems models are not exported from services usually, but we need to do logic here
// OR better, move logic to service. 
// For now, I'll implement the action logic here as per previous plan.

// Need to assure models are registered
import "@/models/Transaction";
import "@/models/GoalItem";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";

export async function deleteGoalPaymentAction(transactionId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await dbConnect();
        const TransactionModel = mongoose.model("Transaction");
        const GoalItemModel = mongoose.model("GoalItem");

        const txn = await TransactionModel.findById(transactionId);
        if (!txn) return { success: false, message: "Transaction not found" };

        if (!txn.goalItem) {
            return { success: false, message: "Not a goal payment" };
        }

        // 1. Revert Wallet Balance
        // If Expense -> Add back amount
        // If Income (rare for goal payment?) -> Deduct
        // Typically goal payments are expenses
        const WalletModel = mongoose.model("Wallet");
        if (txn.type === "EXPENSE") {
            await WalletModel.findByIdAndUpdate(txn.wallet, { $inc: { balance: txn.amount } });
        } else {
             await WalletModel.findByIdAndUpdate(txn.wallet, { $inc: { balance: -txn.amount } });
        }
        
        // 2. Soft Delete Transaction
        await TransactionModel.findByIdAndUpdate(transactionId, { isDeleted: true });

        // 3. Revalidate
        const item = await GoalItemModel.findById(txn.goalItem);
        if (item) {
             revalidatePath(`/goals/${item.goalId}`);
        }
        revalidatePath("/goals");

        return { success: true, message: "Payment reverted successfully" };

    } catch (e: any) {
        return { success: false, message: e.message || "Failed to revert payment" };
    }
}

import { getGoals } from "@/services/goal.service";

export async function getGoalsAction() {
    const session = await getServerSession(authOptions);
    if (!session) return [];
    
    // Default to user name for ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const owner = (session.user as any).id;
    
    try {
        const goals = await getGoals(owner);
        // Serialize IDs
        return JSON.parse(JSON.stringify(goals));
    } catch (error) {
        console.error("Failed to fetch goals:", error);
        return [];
    }
}
