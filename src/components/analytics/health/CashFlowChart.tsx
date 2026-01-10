"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CashFlowChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Cash Flow</CardTitle>
        <CardDescription>
          Surplus (Green) vs Deficit (Red) per month.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="label"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                 cursor={{ fill: 'transparent' }}
                 contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}
                 formatter={(value, name) => [new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value)), name === "income" ? "Income" : "Expense"]}
              />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="expense" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} name="Expense" />
              <Bar dataKey="income" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
