"use server";

import { BudgetService } from "@/services/budget.service";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import Category from "@/models/Category";
import dbConnect from "@/lib/db";

export async function getBudgetOverviewAction(period: string, view?: string) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error("Unauthorized");
  }

  // Validate period format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error("Invalid period format");
  }

  try {
    const overview = await BudgetService.getBudgetOverview((session!.user as any).id, period, view);
    
    // Serialize for Client Component
    return JSON.parse(JSON.stringify(overview));
  } catch (error) {
    console.error("Failed to fetch budget overview:", error);
    throw new Error("Failed to fetch budget overview");
  }
}

export async function upsertBudgetAction(period: string, groups: any[], income: number) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await BudgetService.upsertBudget((session!.user as any).id, period, groups, income);
    revalidatePath("/budget");
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error("Failed to update budget:", error);
    throw new Error("Failed to update budget");
  }
}

export async function generateBudgetFromCategoriesAction(period: string) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await BudgetService.autoGenerateBudget((session!.user as any).id, period);
    revalidatePath("/budget");
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error("Failed to generate budget:", error);
    throw new Error("Failed to generate budget");
  }
}

export async function getCategoriesForBudgetAction() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error("Unauthorized");
  }
  
  await dbConnect();
  const categories = await Category.find({ isDeleted: false }).select("name _id group bucket").sort({ name: 1 }).lean();
  return JSON.parse(JSON.stringify(categories));
}

export async function getBudgetTransactionsAction(period: string) {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
        throw new Error("Unauthorized");
    }
    
    // Validate period format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(period)) {
        throw new Error("Invalid period format");
    }

    try {
        const transactions = await BudgetService.getBudgetTransactions((session!.user as any).id, period);
        return JSON.parse(JSON.stringify(transactions));
    } catch (error) {
        console.error("Failed to fetch budget history:", error);
        throw new Error("Failed to fetch budget history");
    }
}
