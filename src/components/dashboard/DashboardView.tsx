"use client";


import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { MonthlySummary } from "@/components/dashboard/MonthlySummary";
import { PendingTransactions } from "@/components/dashboard/PendingTransactions";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { GoalStatus } from "@/components/dashboard/GoalStatus";
import { SimpleWalletItem } from "@/components/SimpleWalletItem";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp, TrendingDown, History } from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { useSearchParams } from "next/navigation";
import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DashboardView({ initialView }: { initialView: string }) {
    const searchParams = useSearchParams();
    
    const viewParam = searchParams.get("view");
    const currentView = viewParam || initialView;

    // Convert searchParams entries to object
    const paramsObj = Object.fromEntries(searchParams.entries());

    // Custom Hooks using Axios
    const { useDashboardData } = require("@/hooks/useDashboard");
    const { useWallets } = require("@/hooks/useWallets");

    const dashboardQuery = useDashboardData(currentView, paramsObj);
    const walletsQuery = useWallets(currentView);
    
    const isLoading = dashboardQuery.isLoading || walletsQuery.isLoading;
    const isError = dashboardQuery.isError || walletsQuery.isError;
    const dashboardData = dashboardQuery.data;
    const wallets = walletsQuery.data;

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (isError || !dashboardData || !wallets) {
        return (
            <div className="p-8 text-center text-red-500">
                Failed to load dashboard data. Please try again.
            </div>
        );
    }
    
    return (
        <DashboardContent 
            data={dashboardData} 
            wallets={wallets}
            currentView={currentView} 
            params={paramsObj}
        />
    );
}

// Split content to allow hooks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DashboardContent({ data, wallets, currentView, params }: { data: any, wallets: any[], currentView: string, params:any }) {
    const { summary, recentTransactions, expenseByCategory, incomeByCategory, goals, debtStats } = data;
    
    const netWorth = wallets.reduce((sum: number, w: any) => sum + (w.currentBalance || 0), 0);

    return (
        <div className="space-y-6">
        
        {/* Header Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Net Worth Card */}
             <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/10 border border-cyan-100 dark:border-cyan-900/50 p-6 flex flex-col justify-between">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                     <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                </div>

                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-cyan-800 dark:text-cyan-400 font-medium text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                             Total Net Worth
                        </h2>
                        <ViewToggle defaultView={currentView} />
                    </div>
                </div>
                <div className="relative z-10">
                    <div className="text-4xl md:text-5xl font-bold tracking-tight text-cyan-700 dark:text-cyan-300">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(netWorth)}
                    </div>
                </div>
             </div>
             
             {/* Debt Summary Combined Card */}
             {(() => {
                 const borrowed = debtStats?.borrowed || 0;
                 const lent = debtStats?.lent || 0;
                 const total = borrowed + lent;
                 const borrowedPercent = total > 0 ? (borrowed / total) * 100 : 0;
                 const lentPercent = total > 0 ? (lent / total) * 100 : 0;
                 
                 return (
                     <Link href="/debts" className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-zinc-900/10 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center gap-6 group hover:shadow-md transition-all">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5 text-zinc-400" />
                        </div>
                        
                        {/* Borrowed */}
                        <div className="space-y-2 relative z-10">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-zinc-600 dark:text-zinc-400 font-medium uppercase tracking-wider text-xs">You Owe (Utang)</span>
                                 <span className="font-bold text-red-600 dark:text-red-400">
                                     {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(borrowed)}
                                 </span>
                             </div>
                             <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-red-500 rounded-full" style={{ width: `${borrowedPercent}%` }} />
                             </div>
                        </div>

                        {/* Lent */}
                        <div className="space-y-2 relative z-10">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-zinc-600 dark:text-zinc-400 font-medium uppercase tracking-wider text-xs">Owed to You (Piutang)</span>
                                 <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                     {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(lent)}
                                 </span>
                             </div>
                             <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lentPercent}%` }} />
                             </div>
                        </div>
                     </Link>
                 );
             })()}
        </section>

        {/* Analytics Controls & Summary */}
        <section className="space-y-4">
            <div className="flex flex-col gap-4">
                 <PendingTransactions />
                 <AnalyticsControls showOwnerFilter={false} defaultPreset="MTD" defaultView={currentView} />
            </div>

             <div className="flex items-center justify-between mt-2">
                <h2 className="text-xl font-semibold">Overview</h2>
                {/* Dynamic Label */}
             </div>
             
             {(() => {
                 let periodLabel = "Month to Date"; // Default
                 
                 if (params.preset === "YTD") periodLabel = "Year to Date";
                 else if (params.preset === "1Y") periodLabel = "Last 1 Year";
                 else if (params.preset === "3M") periodLabel = "Last 3 Months";
                 else if (params.preset === "1M") periodLabel = "Last 30 Days";
                 else if (params.preset === "7D") periodLabel = "Last 7 Days";
                 else if (params.preset === "MTD") periodLabel = "Month to Date";
                 else if (params.preset === "ALL") periodLabel = "All Time";
                 else if (params.mode === "RANGE" && params.startDate && params.endDate) {
                    try {
                        const start = new Date(params.startDate);
                        const end = new Date(params.endDate);
                        // Using Intl.DateTimeFormat for safer localized formatting without heavy imports if possible, 
                        // but simple .toLocaleDateString is easiest or reuse just formatting logic.
                        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
                        const startStr = start.toLocaleDateString('en-US', options);
                        const endStr = end.toLocaleDateString('en-US', options); // e.g. "Jan 1"
                        periodLabel = `${startStr} - ${endStr}`;
                    } catch (e) {
                        periodLabel = "Selected Period";
                    }
                 } else if (params.mode === "RANGE") {
                     periodLabel = "Selected Period";
                 }

                     return (
                         <div className="space-y-6">
                             <MonthlySummary 
                                income={summary.income} 
                                expense={summary.expense} 
                                net={summary.net} 
                                periodLabel={periodLabel}
                             />

                             {/* Real Cashflow Section */}
                             <div className="grid gap-4 md:grid-cols-2">
                                 {/* Real Income Card */}
                                 <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 p-6">
                                     <div className="absolute top-0 right-0 p-4 opacity-10">
                                         <TrendingUp className="w-24 h-24 text-indigo-600" />
                                     </div>
                                     <div className="relative z-10">
                                         <div className="flex items-center justify-between mb-2">
                                             <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">Real Income</h3>
                                             <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-indigo-100/50 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" asChild>
                                                    <Link href={`/transactions?${new URLSearchParams({ ...params, type: "INCOME", excludeTransfers: "true" }).toString()}`}>
                                                        <History className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                             </div>
                                         </div>
                                         <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                                             {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary.realIncome || 0)}
                                         </div>
                                         <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1">
                                             Excluding transfers
                                         </p>
                                     </div>
                                 </div>

                                 {/* Real Expense Card */}
                                 <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-100 dark:border-orange-900/50 p-6">
                                     <div className="absolute top-0 right-0 p-4 opacity-10">
                                         <TrendingDown className="w-24 h-24 text-orange-600" />
                                     </div>
                                     <div className="relative z-10">
                                         <div className="flex items-center justify-between mb-2">
                                             <h3 className="text-sm font-medium text-orange-800 dark:text-orange-400 uppercase tracking-wider">Real Expense</h3>
                                             <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-orange-100/50 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400" asChild>
                                                    <Link href={`/transactions?${new URLSearchParams({ ...params, type: "EXPENSE", excludeTransfers: "true" }).toString()}`}>
                                                        <History className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                             </div>
                                         </div>
                                         <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                             {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary.realExpense || 0)}
                                         </div>
                                         <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                                             Excluding transfers
                                         </p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     );
                 })()}
        </section>

        {/* Goals Section */}
        {goals && goals.length > 0 && (
            <GoalStatus goals={goals} />
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Wallets */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Wallets</h2>
                     <Button variant="ghost" size="sm" asChild className="hidden text-muted-foreground hover:text-primary">
                        <Link href="/wallets" className="flex items-center gap-1 text-xs">
                             View All <ChevronRight className="w-3 h-3" />
                        </Link>
                     </Button>
                </div>
                
                <div className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {wallets.map((wallet: any) => (
                        <SimpleWalletItem key={wallet._id} wallet={wallet} />
                    ))}
                    
                    {wallets.length === 0 && (
                        <div className="py-8 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-lg border border-dashed text-sm">
                            No wallets found.
                        </div>
                    )}
                </div>
            </section>

            {/* Right Column: Category Breakdown */}
             <section className="space-y-4">
                 <h2 className="text-xl font-semibold">Expense Breakdown</h2>
                 {(() => {
                    let periodLabel = "Month to Date"; // Default
                    if (params.preset === "YTD") periodLabel = "Year to Date";
                    else if (params.preset === "1Y") periodLabel = "Last 1 Year";
                    else if (params.preset === "3M") periodLabel = "Last 3 Months";
                    else if (params.preset === "1M") periodLabel = "Last 30 Days";
                    else if (params.preset === "7D") periodLabel = "Last 7 Days";
                    else if (params.preset === "MTD") periodLabel = "Month to Date";
                    else if (params.preset === "ALL") periodLabel = "All Time";
                     else if (params.mode === "RANGE" && params.startDate && params.endDate) {
                        try {
                            const start = new Date(params.startDate);
                            const end = new Date(params.endDate);
                            const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
                            const startStr = start.toLocaleDateString('en-US', options);
                            const endStr = end.toLocaleDateString('en-US', options);
                            periodLabel = `${startStr} - ${endStr}`;
                        } catch (e) { periodLabel = "Selected Period"; }
                     }
                     return <CategoryBreakdown expenses={expenseByCategory} incomes={incomeByCategory} periodLabel={periodLabel} />;
                 })()}
            </section>
        </div>

        {/* Recent Transactions Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                 <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
                    <Link href="/transactions" className="flex items-center gap-1 text-xs">
                         All Transactions <ChevronRight className="w-3 h-3" />
                    </Link>
                 </Button>
             </div>
             <RecentTransactions transactions={recentTransactions} />
        </section>

      </div>
    );
}
