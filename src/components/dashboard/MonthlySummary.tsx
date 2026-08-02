import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCategorySolidColor } from "@/lib/category-utils";

interface CategoryData {
  name: string;
  value: number;
  icon?: string;
  color?: string;
}

interface MonthlySummaryProps {
  income: number;
  expense: number;
  net: number;
  periodLabel?: string;
  // Optional -- when provided, the Income/Expense cards gain a collapsible
  // "View Breakdown" section (same pattern as the Transactions page).
  incomeCategories?: CategoryData[];
  expenseCategories?: CategoryData[];
}

function CategoryBreakdownList({ categories, total, type }: { categories: CategoryData[]; total: number; type: "INCOME" | "EXPENSE" }) {
  if (!categories || categories.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">No data available</p>;
  }
  return (
    <div className="space-y-2 pt-2">
      {categories.map((cat, idx) => {
        const percentage = total > 0 ? (cat.value / total) * 100 : 0;
        const isTailwindClass = cat.color?.startsWith("bg-");
        const fallbackColor = getCategorySolidColor(cat.name);
        return (
          <div key={idx} className="relative h-9 w-full rounded-md bg-black/5 dark:bg-white/5 overflow-hidden flex items-center">
            <div
              className={cn(
                "absolute top-0 left-0 h-full transition-all opacity-20 dark:opacity-30",
                isTailwindClass ? cat.color : fallbackColor
              )}
              style={{ width: `${percentage}%` }}
            />
            <div className="relative z-10 flex items-center justify-between px-3 w-full text-xs">
              <div className="flex items-center gap-2 truncate max-w-[65%]">
                <span className="text-base">{cat.icon || (type === "INCOME" ? "💰" : "🏷️")}</span>
                <span className="font-medium truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-[11px]">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cat.value)}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">{percentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MonthlySummary({ income, expense, net, periodLabel = "Selected Period", incomeCategories, expenseCategories }: MonthlySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Income Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 p-6 transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-24 h-24 text-emerald-600" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Total Income</h3>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full transition-transform group-hover:scale-110">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(income)}</div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                {periodLabel}
            </p>
            {incomeCategories && (
              <Accordion type="single" collapsible className="w-full border-t border-emerald-200/60 dark:border-emerald-900/50 mt-3 -mb-2">
                <AccordionItem value="income-details" className="border-b-0">
                  <AccordionTrigger className="text-xs py-2 text-emerald-700/70 dark:text-emerald-400/70 hover:text-emerald-800 hover:no-underline font-normal">
                    View Breakdown
                  </AccordionTrigger>
                  <AccordionContent>
                    <CategoryBreakdownList categories={incomeCategories} total={income} type="INCOME" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
        </div>
      </div>

      {/* Expense Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/20 dark:to-rose-900/10 border border-rose-100 dark:border-rose-900/50 p-6 transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown className="w-24 h-24 text-rose-600" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-rose-800 dark:text-rose-400 uppercase tracking-wider">Total Expense</h3>
                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full transition-transform group-hover:scale-110">
                    <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
            </div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{formatCurrency(expense)}</div>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
                {periodLabel}
            </p>
            {expenseCategories && (
              <Accordion type="single" collapsible className="w-full border-t border-rose-200/60 dark:border-rose-900/50 mt-3 -mb-2">
                <AccordionItem value="expense-details" className="border-b-0">
                  <AccordionTrigger className="text-xs py-2 text-rose-700/70 dark:text-rose-400/70 hover:text-rose-800 hover:no-underline font-normal">
                    View Breakdown
                  </AccordionTrigger>
                  <AccordionContent>
                    <CategoryBreakdownList categories={expenseCategories} total={expense} type="EXPENSE" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
        </div>
      </div>

      {/* Net Savings Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-100 dark:border-blue-900/50 p-6 transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-24 h-24 text-blue-600" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400 uppercase tracking-wider">Net Savings</h3>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full transition-transform group-hover:scale-110">
                    <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            <div className={cn("text-2xl font-bold", net >= 0 ? "text-blue-700 dark:text-blue-300" : "text-rose-700 dark:text-rose-300")}>
                 {formatCurrency(net)}
            </div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                {periodLabel}
            </p>
        </div>
      </div>
    </div>
  );
}
