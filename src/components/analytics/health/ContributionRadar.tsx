"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ContributionRadar({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null;

    // Dynamically get keys (Owners) excluding 'subject'
    const keys = Object.keys(data[0]).filter(k => k !== "subject");
    const colors = ["#2563eb", "#db2777", "#16a34a", "#eab308"]; // Blue, Pink, Green, Yellow

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Spending Contribution</CardTitle>
        <CardDescription>
          Who pays for what? (Couple Dynamics)
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[350px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="#e5e5e5" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
              
              {keys.map((key, i) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={colors[i % colors.length]}
                    fill={colors[i % colors.length]}
                    fillOpacity={0.3}
                  />
              ))}
              
              <Legend />
              <Tooltip 
                   contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e5e5' }}
                   formatter={(value: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(value))}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
