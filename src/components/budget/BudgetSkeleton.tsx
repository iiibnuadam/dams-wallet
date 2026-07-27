import { Card, CardContent } from "@/components/ui/card";

export function BudgetSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-pulse">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="h-5 w-32 bg-muted rounded-md mt-2" />
        </div>
        <div className="h-10 w-40 bg-muted rounded-md" />
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-sm bg-muted/20">
            <CardContent className="p-5">
              <div className="h-4 w-24 bg-muted rounded-md mb-2" />
              <div className="h-8 w-32 bg-muted rounded-md mt-1" />
              <div className="h-4 w-36 bg-muted rounded-md mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Custom Envelopes List ── */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="h-6 w-32 bg-muted rounded-md" />
          <div className="h-5 w-24 bg-muted rounded-md" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-muted bg-transparent">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div>
                    <div className="h-5 w-24 bg-muted rounded-md" />
                    <div className="h-4 w-16 bg-muted rounded-md mt-1" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-5 w-20 bg-muted rounded-md ml-auto" />
                  <div className="h-4 w-24 bg-muted rounded-md mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
