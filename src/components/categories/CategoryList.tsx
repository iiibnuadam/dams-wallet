"use client";

import { useTransition, useState } from "react";
import { ICategory, CategoryType } from "@/types/category";
import { deleteCategoryAction } from "@/actions/category-actions";
import { CategoryDialog } from "./CategoryDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2, Tag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CategoryListProps {
    categories: ICategory[];
    type: CategoryType;
}

export function CategoryList({ categories, type }: CategoryListProps) {
    const [isPending, startTransition] = useTransition();
    const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);

    const filtered = categories.filter(c => c.type === type);

    const handleDelete = (id: string) => {
        startTransition(async () => {
            await deleteCategoryAction(id);
        });
    };

    if (filtered.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-zinc-50/30 dark:bg-zinc-900/10">
                 <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                    <Tag className="w-6 h-6 opacity-30" />
                 </div>
                 <p className="font-medium">No {type.toLowerCase()} categories found.</p>
                 <p className="text-xs text-muted-foreground/70 mt-1">Create one to get started!</p>
            </div>
        );
    }

    // Grouping Logic
    const groupedCategories: Record<string, ICategory[]> = {};
    
    filtered.forEach(cat => {
        const groupKey = cat.group || "Others";
        if (!groupedCategories[groupKey]) {
            groupedCategories[groupKey] = [];
        }
        groupedCategories[groupKey].push(cat);
    });

    // Sort groups logic (optional, maybe specific order?)
    // For now, simple object keys (or predefined if we want sorting)
    const groups = Object.keys(groupedCategories).sort((a, b) => {
        if (a === "Others") return 1;
        if (b === "Others") return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="space-y-8">
            {groups.map((group) => (
                <div key={group}>
                    <h3 className="text-lg font-semibold mb-4 px-1 flex items-center gap-2">
                        {group}
                        <span className="text-xs font-normal text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                            {groupedCategories[group].length}
                        </span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {groupedCategories[group].map(cat => (
                            <div 
                                key={String(cat._id)} 
                                className="group relative bg-white dark:bg-zinc-900 border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300"
                            >
                                {/* Icon Bubble */}
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner mb-1 transition-transform group-hover:scale-110",
                                    cat.color || "bg-zinc-100 dark:bg-zinc-800"
                                )}>
                                    {cat.icon || (type === "INCOME" ? "💰" : "🛒")}
                                </div>

                                <div className="text-center w-full">
                                    <p className="font-semibold text-sm truncate w-full px-2" title={cat.name}>{cat.name}</p>
                                    <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                            {cat.flexibility?.substring(0, 3)}
                                        </span>
                                        {cat.bucket && (
                                             <span className={cn(
                                                 "inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider",
                                                 cat.bucket === "NEEDS" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                                 cat.bucket === "WANTS" ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" :
                                                 "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                             )}>
                                                {cat.bucket}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                     <Button 
                                        variant="secondary" 
                                        size="icon" 
                                        className="h-7 w-7 rounded-lg shadow-sm"
                                        onClick={() => setEditingCategory(cat)}
                                     >
                                        <Pencil className="w-3 h-3" />
                                     </Button>
                                     
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg shadow-sm">
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete <strong>{cat.name}</strong>? This will remove it from future selection, but existing historical data will remain intact (soft delete).
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(String(cat._id))} className="bg-rose-600 hover:bg-rose-700">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                     </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            
            {/* Add New Quick Card (Optional, purely visual prompt at end of list) */}
            <CategoryDialog 
                open={!!editingCategory} 
                category={editingCategory}
                onOpenChange={(open) => !open && setEditingCategory(null)} 
            />
        </div>
    );
}
