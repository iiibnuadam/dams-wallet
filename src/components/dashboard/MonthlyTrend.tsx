"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MonthlyTrendProps {
    data: {
        name: string;
        income: number;
        expense: number;
    }[];
}

export function MonthlyTrend({ data }: MonthlyTrendProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Last 6 Months Trend</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis 
                                dataKey="name" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `${value / 1000}k`} // Shorten for labels
                            />
                            <Tooltip 
                                formatter={(value: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value)}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            <Legend />
                            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
