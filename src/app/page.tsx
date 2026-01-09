import { Navbar } from "@/components/Navbar";
import { SimpleWalletItem } from "@/components/SimpleWalletItem";
import { getWallets, getNetWorth } from "@/services/wallet.service";
import { getDashboardData } from "@/services/dashboard.service";
import { MonthlySummary } from "@/components/dashboard/MonthlySummary";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingTransactions } from "@/components/dashboard/PendingTransactions";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { GoalStatus } from "@/components/dashboard/GoalStatus";
import Link from "next/link";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  
  // Determine view: param > session user > ALL
  let currentView = params.view;
  if (!currentView && session?.user?.email) {
    if (session.user.email.includes("adam")) currentView = "ADAM";
    else if (session.user.email.includes("sasti")) currentView = "SASTI";
  }
  const viewToUse = currentView || "ALL";

  const wallets = await getWallets(viewToUse);
  const netWorth = wallets.reduce((sum, w) => sum + (w.currentBalance || 0), 0);
  
  const dashboardData = await getDashboardData(viewToUse);
  const { summary, recentTransactions, expenseByCategory, incomeByCategory } = dashboardData;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* ... (Header & Analytics Summary) ... */}
        {/* Header Section */}
        {/* Header Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Net Worth Card */}
             <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/10 border border-cyan-100 dark:border-cyan-900/50 p-6 flex flex-col justify-between">
                 {/* Re-using icons directly since SimpleWalletItem isn't just an icon */}
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                     <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                </div>

                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-cyan-800 dark:text-cyan-400 font-medium text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                             Total Net Worth
                        </h2>
                        <ViewToggle defaultView={viewToUse} />
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
                 const borrowed = dashboardData.debtStats?.borrowed || 0;
                 const lent = dashboardData.debtStats?.lent || 0;
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



        {/* Analytics Summary */}
        <section>
             <PendingTransactions />
             <h2 className="text-xl font-semibold mb-4">This Month Overview</h2>
             <MonthlySummary income={summary.income} expense={summary.expense} net={summary.net} />
        </section>

        {/* Goals Section */}
        {dashboardData.goals && dashboardData.goals.length > 0 && (
            <GoalStatus goals={dashboardData.goals} />
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                 <CategoryBreakdown expenses={expenseByCategory} incomes={incomeByCategory} />
            </section>
        </div>

        {/* Recent Transactions Section (Moved back) */}
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

      </main>
    </div>
  );
}
