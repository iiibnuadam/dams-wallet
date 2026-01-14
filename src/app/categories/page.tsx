import { getCategoriesAction } from "@/actions/category-actions";
import { CategoryList } from "@/components/categories/CategoryList";
import { CategoryDialog } from "@/components/categories/CategoryDialog";
import { Button } from "@/components/ui/button";
import { Plus, Settings2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import { CategoryType } from "@/types/category";

export const metadata = {
  title: "Categories | DAMS Wallet",
  description: "Manage transaction categories.",
};

export default async function CategoriesPage() {
    // Fetch all categories
    const categories = await getCategoriesAction();

    return (
        <div className="container max-w-5xl py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                     <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Categories <Settings2 className="w-5 h-5 text-muted-foreground" />
                    </h1>
                     <p className="text-muted-foreground">Manage your income and expense categories.</p>
                </div>
                
                <CategoryDialog trigger={
                    <Button className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" /> New Category
                    </Button>
                } />
            </div>

            <Tabs defaultValue={CategoryType.EXPENSE} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value={CategoryType.EXPENSE}>Expenses</TabsTrigger>
                    <TabsTrigger value={CategoryType.INCOME}>Income</TabsTrigger>
                    <TabsTrigger value={CategoryType.TRANSFER}>Transfer</TabsTrigger>
                </TabsList>
                
                <TabsContent value={CategoryType.EXPENSE} className="mt-4">
                     <Suspense fallback={<div>Loading...</div>}>
                         <CategoryList categories={categories} type={CategoryType.EXPENSE} />
                     </Suspense>
                </TabsContent>
                
                <TabsContent value={CategoryType.INCOME} className="mt-4">
                     <Suspense fallback={<div>Loading...</div>}>
                         <CategoryList categories={categories} type={CategoryType.INCOME} />
                     </Suspense>
                </TabsContent>

                <TabsContent value={CategoryType.TRANSFER} className="mt-4">
                     <Suspense fallback={<div>Loading...</div>}>
                         <CategoryList categories={categories} type={CategoryType.TRANSFER} />
                     </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
