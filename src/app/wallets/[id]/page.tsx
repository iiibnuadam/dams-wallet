import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { EditWalletDialog } from "@/components/EditWalletDialog";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFilters } from "@/components/TransactionFilters";
import { MonthlySummary } from "@/components/dashboard/MonthlySummary";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { MonthlyTrend } from "@/components/dashboard/MonthlyTrend";
import { getWallets, getWalletById, getWalletAnalyticsData } from "@/services/wallet.service";
import Wallet from "@/models/Wallet";
import dbConnect from "@/lib/db";
import { ArrowLeft, MoreHorizontal, CreditCard, User, History, TrendingDown, TrendingUp, Copy, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWalletGradient, getWalletIconComponent } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";
import { DailyTrend } from "@/components/dashboard/DailyTrend"; // Reusing existing daily chart
import { WalletViewToggle } from "@/components/WalletViewToggle";

// Quick client component for Copy interaction if we want to keep this page server component? 
// No, this page is server component. We need a small client component for copy button.
import { CopyButton } from "@/components/ui/copy-button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function WalletPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<any> }) {
  await dbConnect();
  
  const { id } = await params;
  const search = await searchParams;
  const view = search.view || "transactions";

  const wallet = await getWalletById(id);

  if (!wallet) {
    notFound();
  }

  // Get Analytics & Transactions
  // Ensure we use the same limit as Infinite Scroll (15) for consistency
  const { summary, expenseByCategory, incomeByCategory, monthlyTrend, transactions, pagination, dailyTrend } = await getWalletAnalyticsData(id, { ...search, limit: 15 });

  // Determine Icon
  const Icon = getWalletIconComponent(wallet.type);

  // Get Other Wallets for Dialog
  const allWallets = await getWallets();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation */}
        <Link href="/wallets" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Wallets
        </Link>
        
        {/* Wallet Header Card */}
        <Card className={cn("text-white border-none shadow-lg overflow-hidden relative bg-gradient-to-br", getWalletGradient(wallet.color))}>
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Icon className="w-32 h-32" />
             </div>
             <CardContent className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4 w-full md:w-auto">
                        <div>
                             <div className="flex items-center gap-2 mb-1 opacity-80">
                                <span className="uppercase tracking-wider text-xs font-semibold">{wallet.type}</span>
                                {wallet.owner && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                                        <User className="w-3 h-3" /> {wallet.owner}
                                    </span>
                                )}
                             </div>
                             <h1 className="text-3xl font-bold tracking-tight">{wallet.name}</h1>
                        </div>
                        
                        <div>
                             <div className="text-sm opacity-70 mb-1">Current Balance</div>
                             <div className="text-4xl font-bold">
                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(wallet.currentBalance || 0)}
                             </div>
                             
                             {/* Bank Details */}
                             {wallet.bankDetails && wallet.bankDetails.accountNumber && (
                                 <div className="mt-4 pt-4 border-t border-white/20">
                                     <div className="flex flex-col gap-1">
                                        <div className="text-sm opacity-80 flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            <span>
                                                {wallet.bankDetails.bankName || "Bank"} - {wallet.bankDetails.accountHolder || wallet.owner}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-black/20 px-2 py-1 rounded text-sm font-mono tracking-wide">
                                                {wallet.bankDetails.accountNumber}
                                            </code>
                                            <CopyButton value={wallet.bankDetails.accountNumber} />
                                        </div>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto items-center">
                        <div className="hidden md:block">
                            <WalletViewToggle currentView={view} />
                        </div>
                        <div className="hidden md:block">
                            <AddTransactionDialog wallets={allWallets} defaultWalletId={id} />
                        </div>
                        <EditWalletDialog wallet={wallet} />
                    </div>
                </div>
                {/* Mobile Toggle */}
                <div className="mt-4 md:hidden block">
                    <WalletViewToggle currentView={view} />
                </div>
             </CardContent>
        </Card>

        {view === "transactions" ? (
            <>
                {/* Filters */}
                {/* Filters */}
                <div id="history" className="space-y-4">
                    <div className="flex items-center gap-2">
                         <History className="w-5 h-5 text-muted-foreground" />
                         <h2 className="text-lg font-semibold">Transactions</h2>
                    </div>
                
                    <TransactionFilters wallets={[]} showWalletFilter={false} />
                </div>

                {/* Transaction List */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border p-1">
                    <TransactionList 
                        transactions={transactions} 
                        pagination={pagination} 
                        contextParams={{ walletId: id, userFilter: "ALL" }} 
                    />
                </div>
                
                <p className="text-center text-xs text-muted-foreground italic">
                    Showing transactions based on current filters. 
                </p>
            </>
        ) : (
            /* Analytics Section */
            <div className="space-y-6 pt-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <h2 className="text-lg font-semibold flex items-center gap-2">
                         <History className="w-5 h-5" /> Analytics
                    </h2>
                    <div className="w-full md:w-auto">
                        <AnalyticsControls showOwnerFilter={false} defaultPreset="MTD" />
                    </div>
                </div>

                 {/* Averages Cards */}
                 <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Avg. Daily Spend</p>
                                <p className="text-lg font-bold text-red-700 dark:text-red-400">
                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.avgDailyExpense || 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                         <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Avg. Daily Income</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(summary.avgDailyIncome || 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
                
                 <MonthlySummary income={summary.income} expense={summary.expense} net={summary.net} />
                 
                 {/* Daily Trend Chart */}
                 <div className="space-y-2">
                     <h3 className="text-sm font-medium text-muted-foreground">Daily Activity</h3>
                     <DailyTrend data={dailyTrend} />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <CategoryBreakdown expenses={expenseByCategory} incomes={incomeByCategory} />
                 </div>
            </div>
        )}
      </main>
    </div>
  );
}
