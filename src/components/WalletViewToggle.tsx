"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// interface WalletViewToggleProps {
//   currentView: "transactions" | "analytics";
// }

export function WalletViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "transactions";

  const handleToggle = (view: "transactions" | "analytics") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    
    // Clear filters when switching views to ensure fresh state/avoid confusion
    if (view === "transactions") {
        // Clear analytics params
        params.delete("mode");
        params.delete("preset");
        params.delete("startDate");
        params.delete("endDate");
        params.delete("month");
        params.delete("week");
        params.delete("year");
    } else {
        // Clear transaction filters
        params.delete("type");
        params.delete("category");
        params.delete("q");
        params.delete("minAmount");
        params.delete("maxAmount");
        params.delete("sort");
        
        // Ensure default MTD logic triggers by clearing mode if switching fresh?
        // Actually, if we clear analytics params, AnalyticsControls will default to MTD (visual) 
        // and Service will default to MTD (logic). Perfect.
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex w-full p-1 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleToggle("transactions")}
        className={cn(
          "flex-1 h-8 px-3 text-xs font-medium rounded-md transition-all gap-2",
          currentView === "transactions"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <List className="w-3.5 h-3.5" />
        Transactions
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleToggle("analytics")}
        className={cn(
          "flex-1 h-8 px-3 text-xs font-medium rounded-md transition-all gap-2",
          currentView === "analytics"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Analytics
      </Button>
    </div>
  );
}
