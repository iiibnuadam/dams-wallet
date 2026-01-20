"use client";

import { PieChart as PieChartIcon } from "lucide-react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CategoryData {
  name: string;
  value: number;
  icon?: string;
  color?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface CategoryBreakdownProps {
  expenses: CategoryData[];
  incomes: CategoryData[];
  periodLabel?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export function CategoryBreakdown({ expenses, incomes, periodLabel }: CategoryBreakdownProps) {
  const [activeTab, setActiveTab] = useState("EXPENSE");

  const data = activeTab === "EXPENSE" ? expenses : incomes;
  const title = activeTab === "EXPENSE" ? "Expense Breakdown" : "Income Breakdown";

  // Sort data by value desc for better visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const maxValue = sortedData.length > 0 ? sortedData[0].value : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="col-span-1 border-none shadow-none min-h-[300px]">
      <CardHeader className="px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                 <CardTitle className="text-lg">{title}</CardTitle>
                 {periodLabel && <CardDescription className="text-xs mt-1">{periodLabel}</CardDescription>}
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-[180px]">
                <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="INCOME" className="text-xs">Income</TabsTrigger>
                    <TabsTrigger value="EXPENSE" className="text-xs">Expense</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
      </CardHeader>
      <CardContent className="px-4">
        {sortedData.length === 0 ? (
             <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border-dashed border rounded-lg text-sm bg-muted/50 gap-2">
                 <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    <PieChartIcon className="w-6 h-6 opacity-50" />
                 </div>
                 <p>No data available for this period.</p>
             </div>
        ) : (
            <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-5">
                    {sortedData.map((item, index) => {
                        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                        // Fallback to cycling colors if no custom color
                        // Ensure custom color class is handled if it's a Tailwind class (usually bg-...)
                        // But style={{ backgroundColor }} expects a hex code. 
                        // Our categories store "bg-red-500". This CANNOT be used in style={{ backgroundColor }}.
                        // We must use className for Tailwind classes.
                        
                        const isTailwindClass = item.color?.startsWith("bg-");
                        const fallbackColor = COLORS[index % COLORS.length];

                        return (
                            <div key={item.name} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 max-w-[70%]">
                                        {/* Icon Box */}
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0",
                                            isTailwindClass ? item.color?.replace("bg-", "bg-opacity-10 bg-") : "bg-zinc-100 dark:bg-zinc-800",
                                            // If using hex, we need inline style, but here we prefer classes.
                                            // Creating a subtle background for the icon
                                            isTailwindClass && item.color
                                        )}>
                                            {/* Since item.color is "bg-red-500", it sets background. Text should be white/contrast? 
                                                Actually, icon bubbles in list were solid. Let's make this small solid bubble.
                                            */}
                                            <span className={cn("text-base drop-shadow-sm")}>
                                                {item.icon || (activeTab === "INCOME" ? "💰" : "🛒")}
                                            </span>
                                        </div>
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {formatCurrency(item.value)}
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className={cn("h-full rounded-full transition-all duration-500 ease-out", !isTailwindClass && "bg-primary")}
                                        style={{ 
                                            width: `${percentage}%`, 
                                            backgroundColor: isTailwindClass ? undefined : fallbackColor // Use fallback hex if not tailwind
                                        }}
                                    >
                                        {/* For Tailwind classes, we apply them directly via class if possible. 
                                            But 'bg-red-500' is a class. We can't interpolate it into style.
                                            So we render a div with the class.
                                        */}
                                        {isTailwindClass && (
                                            <div className={cn("h-full w-full", item.color)} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
