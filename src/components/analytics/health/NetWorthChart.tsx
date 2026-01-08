"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NetWorthChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="text-center text-muted-foreground p-4">No data available</div>;

  const latest = data[data.length - 1]?.netWorth || 0;
  const growth = data.length > 1
      ? latest - data[0].netWorth
      : 0; // Simple growth from start to end of period
  const growthPercent = data.length > 1 && data[0].netWorth !== 0
      ? (growth / data[0].netWorth) * 100
      : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Evolution</CardTitle>
        <CardDescription>
          Tracking your wealth growth over the last 6 months.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E5" />
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
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                 contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}
                 itemStyle={{ color: '#09090b' }}
                 formatter={(value: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(value))}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, fill: "#2563eb" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
