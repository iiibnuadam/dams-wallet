import Category, { ICategoryDocument, CategoryType } from "@/models/Category";
import { ICategory } from "@/types/category";
import dbConnect from "@/lib/db";

export const CategoryService = {
  async getCategories(type?: string): Promise<ICategory[]> {
    await dbConnect();
    const query = type && type !== "ALL" ? { type, isDeleted: false } : { isDeleted: false };
    const categories = await Category.find(query).sort({ name: 1 }).lean();
    
    return categories.map(cat => ({
        ...cat,
        _id: cat._id.toString(),
        createdAt: cat.createdAt ? new Date(cat.createdAt).toISOString() : undefined,
        updatedAt: cat.updatedAt ? new Date(cat.updatedAt).toISOString() : undefined
    })) as ICategory[];
  },

  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    await dbConnect();
    
    // Check for duplicates
    const existing = await Category.findOne({ 
        name: { $regex: new RegExp(`^${data.name}$`, "i") }, 
        type: data.type, 
        isDeleted: false 
    });
    
    if (existing) {
        throw new Error(`Category '${data.name}' already exists.`);
    }

    const category = await Category.create(data);
    return {
        ...category.toObject(),
        _id: category._id.toString(),
        createdAt: category.createdAt ? new Date(category.createdAt).toISOString() : undefined,
        updatedAt: category.updatedAt ? new Date(category.updatedAt).toISOString() : undefined
    } as ICategory;
  },

  async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    await dbConnect();
    // Check for duplicates if name matches, excluding current
    if (data.name) {
         const existing = await Category.findOne({ 
            name: { $regex: new RegExp(`^${data.name}$`, "i") }, 
            type: data.type, 
            isDeleted: false,
            _id: { $ne: id }
        });
        if (existing) {
             throw new Error(`Category '${data.name}' already exists.`);
        }
    }

    const category = await Category.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!category) return null;
    
     return {
        ...category,
        _id: category._id.toString(),
        createdAt: category.createdAt ? new Date(category.createdAt).toISOString() : undefined,
        updatedAt: category.updatedAt ? new Date(category.updatedAt).toISOString() : undefined
    } as ICategory;
  },

  async deleteCategory(id: string): Promise<boolean> {
    await dbConnect();
    // Soft delete
    await Category.findByIdAndUpdate(id, { isDeleted: true });
    return true;
  }
};
