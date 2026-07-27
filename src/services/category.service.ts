import { apiFetch } from "../lib/api";
import { ICategory } from "@/types/category";

export const CategoryService = {
  async getCategories(type?: string): Promise<ICategory[]> {
    return apiFetch<ICategory[]>("/categories", {
      params: { type },
    });
  },

  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    return apiFetch<ICategory>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    return apiFetch<ICategory>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: string): Promise<boolean> {
    await apiFetch<void>(`/categories/${id}`, {
      method: "DELETE",
    });
    return true;
  }
};
