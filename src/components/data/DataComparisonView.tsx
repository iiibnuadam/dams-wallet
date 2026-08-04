"use client";

import React, { useEffect, useState } from "react";
import { CashFlowChart } from "@/components/analytics/health/CashFlowChart";
import { BudgetTrendChart } from "./BudgetTrendChart";
import { getDashboardData } from "@/services/dashboard.service";
import { BudgetService } from "@/services/budget.service";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function DataComparisonView() {
  const [loading, setLoading] = useState(true);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (label: string) => {
    setExpandedRow(prev => (prev === label ? null : label));
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch Dashboard Data for Monthly Trend (Income/Expense) for ALL household
        const dashboard = await getDashboardData("ALL");
        const monthlyTrend = dashboard.monthlyTrend || [];
        setCashFlowData(monthlyTrend);

        // Fetch Historical Budget Data (Last 6 Months)
        const historicalBudget = await BudgetService.getBudgetHistorical(6);
        
        // Format Budget Data for Chart
        const bData = historicalBudget.map((b) => ({
          label: b.period,
          budget: b.totalBudget,
          spent: b.totalSpent,
          envelopes: b.envelopes,
        })).sort((a, b) => a.label.localeCompare(b.label)); // Ensure chronological sort
        setBudgetData(bData);

        // Combine Data for Table
        const combined = bData.map((b) => {
            const cf = monthlyTrend.find((m: any) => m.label === b.label) || { income: 0, expense: 0 };
            return {
                label: b.label,
                income: cf.income,
                expense: cf.expense,
                net: cf.income - cf.expense,
                netGrowth: 0,
                totalBudget: b.budget,
                totalSpent: b.spent,
                envelopes: b.envelopes || [],
            };
        });

        // Calculate MoM Growth
        for (let i = 0; i < combined.length; i++) {
            if (i === 0) {
                combined[i].netGrowth = 0;
            } else {
                const prevNet = combined[i - 1].net;
                const currentNet = combined[i].net;
                if (prevNet === 0) {
                    combined[i].netGrowth = currentNet > 0 ? 100 : (currentNet < 0 ? -100 : 0);
                } else {
                    combined[i].netGrowth = ((currentNet - prevNet) / Math.abs(prevNet)) * 100;
                }
            }
        }

        // Reverse for table (newest first)
        setTableData(combined.reverse());

      } catch (error) {
        console.error("Failed to fetch data comparison:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <CashFlowChart data={cashFlowData} />
        <BudgetTrendChart data={budgetData} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Table (Month over Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right text-green-600">Income</TableHead>
                  <TableHead className="text-right text-red-600">Expense</TableHead>
                  <TableHead className="text-right font-bold">Net</TableHead>
                  <TableHead className="text-right">MoM Growth</TableHead>
                  <TableHead className="text-right text-blue-600">Budget Limit</TableHead>
                  <TableHead className="text-right text-yellow-600">Budget Spent</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                            No data available
                        </TableCell>
                    </TableRow>
                ) : (
                    tableData.map((row) => (
                    <React.Fragment key={row.label}>
                    <TableRow className={expandedRow === row.label ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(row.income)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatCurrency(row.expense)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(row.net)}</TableCell>
                        <TableCell className={`text-right ${row.netGrowth > 0 ? 'text-green-600' : row.netGrowth < 0 ? 'text-red-600' : ''}`}>
                            {row.netGrowth > 0 ? '+' : ''}{row.netGrowth.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right text-blue-600">{formatCurrency(row.totalBudget)}</TableCell>
                        <TableCell className="text-right text-yellow-600">{formatCurrency(row.totalSpent)}</TableCell>
                        <TableCell className="text-right">
                            {row.totalSpent > row.totalBudget ? (
                                <span className="text-red-600 font-medium text-xs bg-red-100 px-2 py-1 rounded">Over Budget</span>
                            ) : (
                                <span className="text-green-600 font-medium text-xs bg-green-100 px-2 py-1 rounded">Under Budget</span>
                            )}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => toggleRow(row.label)}
                            >
                                {expandedRow === row.label ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </TableCell>
                    </TableRow>
                    
                    {expandedRow === row.label && (
                        <TableRow>
                            <TableCell colSpan={9} className="p-0 border-b">
                                <div className="p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="font-semibold text-sm mb-3">Budget Details - {row.label}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {row.envelopes.length > 0 ? (
                                            row.envelopes.map((env: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center p-3 border rounded bg-background">
                                                    <div>
                                                        <p className="font-medium text-sm">{env.name}</p>
                                                        <p className="text-xs text-muted-foreground">{env.isNeeds ? 'Needs' : 'Wants'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-bold ${env.spent > env.limit ? 'text-red-600' : 'text-green-600'}`}>
                                                            {formatCurrency(env.spent)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">of {formatCurrency(env.limit)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground col-span-full">No budget envelopes found for this period.</p>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                    </React.Fragment>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
