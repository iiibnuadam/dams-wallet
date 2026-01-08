"use server";

import dbConnect from "@/lib/db";
import Category, { CategoryType } from "@/models/Category";

export async function getCategories(type?: CategoryType) {
  await dbConnect();
  
  const query = type ? { type, isDeleted: false } : { isDeleted: false };
  
  const categories = await Category.find(query).sort({ name: 1 }).lean();
  
  return categories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      type: cat.type,
  }));
}
