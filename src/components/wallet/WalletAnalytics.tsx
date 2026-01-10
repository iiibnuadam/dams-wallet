import { getWalletAnalyticsData } from "@/services/wallet.service";
import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, History } from "lucide-react";
import { MonthlySummary } from "@/components/dashboard/MonthlySummary";
import { DailyTrend } from "@/components/dashboard/DailyTrend";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import dbConnect from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function WalletAnalytics({ walletId, searchParams }: { walletId: string, searchParams: any }) {
    await dbConnect();
    const { summary, expenseByCategory, incomeByCategory, dailyTrend } = await getWalletAnalyticsData(walletId, { ...searchParams, limit: 15 });

    return (
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
            
                <MonthlySummary 
                    income={summary.income} 
                    expense={summary.expense} 
                    net={summary.net} 
                    periodLabel={(() => {
                        if (searchParams.preset === "YTD") return "Year to Date";
                        if (searchParams.preset === "1Y") return "Last 1 Year";
                        if (searchParams.preset === "3M") return "Last 3 Months";
                        if (searchParams.preset === "1M") return "Last 30 Days";
                        if (searchParams.preset === "7D") return "Last 7 Days";
                        if (searchParams.preset === "MTD") return "Month to Date";
                        if (searchParams.preset === "ALL") return "All Time";
                        if (searchParams.mode === "RANGE" && searchParams.startDate && searchParams.endDate) {
                            try {
                                const start = new Date(searchParams.startDate);
                                const end = new Date(searchParams.endDate);
                                const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
                                const startStr = start.toLocaleDateString('en-US', options);
                                const endStr = end.toLocaleDateString('en-US', options);
                                return `${startStr} - ${endStr}`;
                            } catch (e) { return "Selected Period"; }
                        }
                        return "This Month";
                    })()}
                />
                
                {/* Daily Trend Chart */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Daily Activity</h3>
                    <DailyTrend data={dailyTrend} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CategoryBreakdown 
                        expenses={expenseByCategory} 
                        incomes={incomeByCategory} 
                        periodLabel={(() => {
                            if (searchParams.preset === "YTD") return "Year to Date";
                            if (searchParams.preset === "1Y") return "Last 1 Year";
                            if (searchParams.preset === "3M") return "Last 3 Months";
                            if (searchParams.preset === "1M") return "Last 30 Days";
                            if (searchParams.preset === "7D") return "Last 7 Days";
                            if (searchParams.preset === "MTD") return "Month to Date";
                            if (searchParams.preset === "ALL") return "All Time";
                            if (searchParams.mode === "RANGE" && searchParams.startDate && searchParams.endDate) {
                                try {
                                    const start = new Date(searchParams.startDate);
                                    const end = new Date(searchParams.endDate);
                                    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
                                    const startStr = start.toLocaleDateString('en-US', options);
                                    const endStr = end.toLocaleDateString('en-US', options);
                                    return `${startStr} - ${endStr}`;
                                } catch (e) { return "Selected Period"; }
                            }
                            return "This Month";
                        })()}
                    />
                </div>
        </div>
    );
}
