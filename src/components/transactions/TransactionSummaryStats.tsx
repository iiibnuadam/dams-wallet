"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCategorySolidColor } from "@/lib/category-utils";
import { cn } from "@/lib/utils";

export function TransactionSummaryStats({ params }: { params: Record<string, any> }) {
    const { data, isLoading } = useQuery({
        queryKey: ['transactions', 'summary', params],
        queryFn: async () => {
             const queryParams = new URLSearchParams();
             Object.entries({ ...params, summaryOnly: true }).forEach(([key, value]) => {
                if (value !== undefined && value !== null && String(value) !== "") {
                    queryParams.append(key, String(value));
                }
             });
             const res = await apiClient.get(`/transactions?${queryParams.toString()}`);
             return res.data;
        }
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        );
    }

    const { summary } = data || {};
    const { totalIncome = 0, totalExpense = 0, net = 0, incomeCategories = [], expenseCategories = [] } = summary || {};

    // Helper to render Category List
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCategoryList = (categories: any[], type: "INCOME" | "EXPENSE") => {
        if (!categories || categories.length === 0) return <p className="text-xs text-muted-foreground py-2">No data available</p>;
        
        const totalValue = type === "INCOME" ? totalIncome : totalExpense;

        return (
            <div className="space-y-2 pt-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {categories.map((cat: any, idx: number) => {
                    const percentage = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
                    
                    // Logic to handle custom color vs fallback
                    const isTailwindClass = cat.color?.startsWith("bg-");
                    const fallbackColor = getCategorySolidColor(cat.name); // Fallback logic
                    
                    return (
                        <div key={idx} className="relative h-9 w-full rounded-md bg-zinc-100 dark:bg-zinc-800/50 overflow-hidden flex items-center">
                            {/* Bar Overlay */}
                            <div 
                                className={cn(
                                    "absolute top-0 left-0 h-full transition-all opacity-20 dark:opacity-30",
                                    isTailwindClass ? cat.color : fallbackColor
                                )} 
                                style={{ width: `${percentage}%` }}
                            />
                            
                            {/* Content Layer */}
                            <div className="relative z-10 flex items-center justify-between px-3 w-full text-xs">
                                <div className="flex items-center gap-2 truncate max-w-[65%]">
                                     <span className="text-base">{cat.icon || (type === "INCOME" ? "💰" : "🏷️")}</span>
                                     <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                        {cat.name}
                                     </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">
                                         {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cat.value)}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                        {percentage.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             {/* INCOME CARD */}
             <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50 shadow-sm pb-0">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Income</p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalIncome)}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ArrowDownLeft className="h-5 w-5" />
                        </div>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full border-t border-emerald-100 dark:border-emerald-900/50">
                        <AccordionItem value="income-details" className="border-b-0">
                            <AccordionTrigger className="text-xs py-2 text-emerald-600/70 hover:text-emerald-700 hover:no-underline font-normal">
                                View Breakdown
                            </AccordionTrigger>
                            <AccordionContent>
                                {renderCategoryList(incomeCategories, "INCOME")}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
             </Card>

             {/* EXPENSE CARD */}
             <Card className="bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/50 shadow-sm pb-0">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                         <div>
                            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Expense</p>
                            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalExpense)}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                    </div>

                    <Accordion type="single" collapsible className="w-full border-t border-rose-100 dark:border-rose-900/50">
                        <AccordionItem value="expense-details" className="border-b-0">
                            <AccordionTrigger className="text-xs py-2 text-rose-600/70 hover:text-rose-700 hover:no-underline font-normal">
                                View Breakdown
                            </AccordionTrigger>
                            <AccordionContent>
                                {renderCategoryList(expenseCategories, "EXPENSE")}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
             </Card>

             {/* NET FLOW CARD */}
             <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm md:block hidden pb-0">
                <CardContent className="p-4 flex items-center justify-between h-full">
                    <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Net Flow</p>
                        <p className={`text-2xl font-bold mt-1 ${net >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-600'}`}>
                            {net > 0 ? "+" : ""}{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(net)}
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
