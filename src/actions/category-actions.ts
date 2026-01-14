"use server";

import { CategoryService } from "@/services/category.service";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCategoriesAction(type?: string) {
  try {
    const categories = await CategoryService.getCategories(type);
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function createCategoryAction(data: any) {
  const session = await getServerSession(authOptions);
  
  try {
    const category = await CategoryService.createCategory(data);
    
    // Auto-Sync to Budget if User is logged in
    if ((session?.user as any)?.id) {
        const { BudgetService } = await import("@/services/budget.service");
        await BudgetService.syncNewCategoryGroup((session!.user as any).id, category);
    }

    revalidatePath("/categories");
    revalidatePath("/budget"); 
    revalidatePath("/transactions");
    return JSON.parse(JSON.stringify(category));
  } catch (error: any) {
    console.error("Failed to create category:", error);
    throw new Error(error.message || "Failed to create category");
  }
}

export async function updateCategoryAction(id: string, data: any) {
  try {
    const category = await CategoryService.updateCategory(id, data);
    revalidatePath("/categories");
    revalidatePath("/budget");
    revalidatePath("/transactions");
    return JSON.parse(JSON.stringify(category));
  } catch (error: any) {
    console.error("Failed to update category:", error);
    throw new Error(error.message || "Failed to update category");
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await CategoryService.deleteCategory(id);
    revalidatePath("/categories");
    revalidatePath("/budget");
    revalidatePath("/transactions");
    return true;
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw new Error("Failed to delete category");
  }
}
