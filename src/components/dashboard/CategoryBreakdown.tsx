"use client";

import { PieChart as PieChartIcon } from "lucide-react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryData {
  name: string;
  value: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface CategoryBreakdownProps {
  expenses: CategoryData[];
  incomes: CategoryData[];
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

export function CategoryBreakdown({ expenses, incomes }: CategoryBreakdownProps) {
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
      <CardHeader className="px-4 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                 <CardTitle className="text-lg">{title}</CardTitle>
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
            <div className="space-y-5">
                {sortedData.map((item, index) => {
                    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    const color = COLORS[index % COLORS.length];
                    
                    return (
                        <div key={item.name} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[60%]">
                                    {item.name}
                                </span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {formatCurrency(item.value)}
                                </span>
                            </div>
                            <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{ 
                                        width: `${percentage}%`, 
                                        backgroundColor: color 
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
