"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SmartSummary({ insights }: { insights: any[] }) {
    if (!insights || insights.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {// eslint-disable-next-line @typescript-eslint/no-explicit-any
            insights.map((insight: any, i: number) => (
                <Card key={i} className={`border-l-4 ${
                    insight.status === 'positive' ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10' : 
                    insight.status === 'warning' ? 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10' : 
                    'border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/10'
                }`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            {insight.title}
                            {insight.status === 'positive' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                             insight.status === 'warning' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> :
                             <TrendingUp className="w-4 h-4 text-indigo-600" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-1">{insight.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {insight.message}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
