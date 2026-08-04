"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BudgetTrendChart({ data }: { data: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const envelopeNames = Array.from(new Set(
    data.flatMap(d => d.envelopes?.map((e: any) => e.name) || [])
  )).sort();

  const chartData = data.map(d => {
    if (selectedCategory === "ALL") return d;
    const env = d.envelopes?.find((e: any) => e.name === selectedCategory);
    return {
      ...d,
      budget: env ? env.limit : 0,
      spent: env ? env.spent : 0,
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle>Budget vs Spent</CardTitle>
          <CardDescription>
            Perbandingan antara batas Budget bulanan (Biru) dan Total Pengeluaran (Kuning).
          </CardDescription>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Total Keseluruhan</SelectItem>
            {envelopeNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
                 formatter={(value, name) => [new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value)), name === "budget" ? "Budget Limit" : "Total Spent"]}
              />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="budget" fill="#3b82f6" radius={[4, 4, 0, 0]} name="budget" />
              <Bar dataKey="spent" fill="#eab308" radius={[4, 4, 0, 0]} name="spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
