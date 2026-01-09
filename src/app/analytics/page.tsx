import { getDashboardData } from "@/services/dashboard.service";
import { getFinancialHealthData } from "@/services/financial-health.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MonthlyTrend } from "@/components/dashboard/MonthlyTrend"; // Keeping if user wants diff visualization, but maybe CashFlowChart is enough
import { DailyTrend } from "@/components/dashboard/DailyTrend";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";
import { AnalyticsExportListener } from "@/components/analytics/AnalyticsExportListener";

// Health Components
import { NetWorthChart } from "@/components/analytics/health/NetWorthChart";
import { CashFlowChart } from "@/components/analytics/health/CashFlowChart";
import { FixedFlexRatio } from "@/components/analytics/health/FixedFlexRatio";
import { ContributionRadar } from "@/components/analytics/health/ContributionRadar";
import { SmartSummary } from "@/components/analytics/health/SmartSummary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Clock } from "lucide-react";


export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  
  // Parallel Fetching
  const owner = params.owner || "ALL";
  const [dashboardData, healthData] = await Promise.all([
      getDashboardData(owner, params),
      getFinancialHealthData(owner, params)
  ]);

  const { expenseByCategory, incomeByCategory, dailyTrend, period, summary } = dashboardData;
  const { trend, macroStats, fixedVsVariable, radarData, liabilities, insights } = healthData;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <div className="flex flex-col gap-4">
               {/* 1. Top Section: Controls & AI Summary */}
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                   <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            Financial Analytics
                            <BarChart3 className="w-6 h-6" />
                        </h1>
                        <p className="text-muted-foreground">Comprehensive health check & reports.</p>
                   </div>
                   {/* Removed separate button, integrated view */}
               </div>
               
               <AnalyticsControls />
               <SmartSummary insights={insights} />
            </div>

        {/* 2. Macro View */}
        <section className="space-y-4">
             <h2 className="text-xl font-semibold flex items-center gap-2">1. Macro View <span className="text-sm font-normal text-muted-foreground">(Trend & Cash Flow)</span></h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
             <NetWorthChart data={trend} />
             <CashFlowChart data={trend} />
        </div>
        </section>

        {/* 3. Spending Behavior */}
        <section className="space-y-4">
             <h2 className="text-xl font-semibold flex items-center gap-2">2. Spending Behavior <span className="text-sm font-normal text-muted-foreground">(Structure & Breakdown)</span></h2>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                     <FixedFlexRatio data={fixedVsVariable} />
                     <ContributionRadar data={radarData} />
                </div>
                <div className="lg:col-span-2">
                     <CategoryBreakdown expenses={expenseByCategory} incomes={incomeByCategory} />
                </div>
            </div>
        </section>

        {/* 4. Detailed Future & Liabilities */}
        {liabilities.length > 0 && (
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">3. Freedom Roadmap <span className="text-sm font-normal text-muted-foreground">(Liabilities)</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {liabilities.map((item: any, i: number) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex justify-between">
                                    {item.name}
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-bold">{item.progress.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={item.progress} className="h-2" />
                                    <div className="flex justify-between text-xs text-muted-foreground pt-2">
                                        <span>{item.monthsPassed} months paid</span>
                                        <span>{item.monthsLeft} months left</span>
                                    </div>
                                    <div className="text-center mt-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-sm text-zinc-600 dark:text-zinc-400">
                                        Freedom in approx. <strong>{(item.monthsLeft / 12).toFixed(1)} years</strong>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        )}
        
        {/* 5. Daily Trend (Deep Dive) */}
        <section className="space-y-4">
             <h2 className="text-xl font-semibold">4. Daily Activity</h2>
             <DailyTrend data={dailyTrend} />
        </section>

        <AnalyticsExportListener data={{
            period,
            summary,
            expenseByCategory,
            incomeByCategory,
            monthlyTrend: trend, // Use the better trend data
            dailyTrend
        }} />
      </main>
    </div>
  );
}
