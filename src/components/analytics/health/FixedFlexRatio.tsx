"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FixedFlexRatio({ data }: { data: { fixed: number, variable: number, ratio: number } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixed vs Variable Cost</CardTitle>
        <CardDescription>
          Ideally, Fixed Cost (Debt, Bills) should be below 50-60%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-end">
            <div>
                <div className="text-3xl font-bold">{data.ratio.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Fixed Cost Ratio</div>
            </div>
             <div className="text-right">
                <div className="text-sm font-medium text-red-600">Fixed: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(data.fixed)}</div>
                <div className="text-sm font-medium text-green-600">Variable: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(data.variable)}</div>
            </div>
        </div>

        <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            {/* Fixed Part */}
            <div 
                className="h-full bg-red-500 flex items-center justify-center text-xs text-white font-medium transition-all"
                style={{ width: `${Math.min(100, data.ratio)}%` }}
            >
                {data.ratio > 10 && "Fixed"}
            </div>
            {/* Variable Part */}
            <div 
                className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium transition-all"
                style={{ width: `${Math.max(0, 100 - data.ratio)}%` }}
            >
                {100 - data.ratio > 10 && "Variable"}
            </div>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
            {data.ratio > 60 
             ? "⚠️ Your fixed costs are high. Try to lower debt or recurring bills." 
             : "✅ Healthy ratio! You have good financial flexibility."}
        </p>
      </CardContent>
    </Card>
  );
}
