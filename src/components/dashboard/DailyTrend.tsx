"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface DailyTrendProps {
    data: {
        label: string;
        date: string;
        expense: number;
    }[];
    average?: number;
}

export function DailyTrend({ data, average }: DailyTrendProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Daily Expense (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="label" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                            />
                            <YAxis 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip 
                                formatter={(value: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value)}
                                labelFormatter={(label) => `Day ${label}`}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="expense" 
                                stroke="#f59e0b" 
                                fillOpacity={1} 
                                fill="url(#colorExpense)" 
                            />
                            {average && (
                                <ReferenceLine 
                                    y={average} 
                                    stroke="#f59e0b" 
                                    strokeDasharray="3 3" 
                                    label={{ value: "Avg", position: "insideBottomRight", fill: "#f59e0b" }} 
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
