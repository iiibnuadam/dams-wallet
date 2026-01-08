"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";
import { Calendar as CalendarIcon, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type ReportMode = "WEEK" | "MONTH" | "YEAR" | "RANGE" | "ALL" | "PRESET";

const OWNERS = [
    { label: "All", value: "ALL" },
    { label: "Adam", value: "ADAM" },
    { label: "Sasti", value: "SASTI" },
];

export function AnalyticsControls({ 
    showOwnerFilter = true,
    defaultPreset = "3M"
}: { 
    showOwnerFilter?: boolean;
    defaultPreset?: "MTD" | "3M" | "ALL" | "7D" | "1M" | "YTD" | "1Y";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentMode = (searchParams.get("mode") as ReportMode) || "MONTH";
  const currentOwner = searchParams.get("owner") || "ALL";
  const currentMonth = searchParams.get("month") || format(new Date(), "yyyy-MM");
  const currentWeek = searchParams.get("week") || format(new Date(), "yyyy-'W'II"); // ISO Week
  const currentYear = searchParams.get("year") || format(new Date(), "yyyy");
  const currentStartDate = searchParams.get("startDate");
  const currentEndDate = searchParams.get("endDate");
  
  const [date, setDate] = useState<Date | undefined>(
    currentMode === "RANGE" && currentStartDate ? new Date(currentStartDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentMode === "RANGE" && currentEndDate ? new Date(currentEndDate) : undefined
  );

  // Default Redirect to 3M if no params
  // eslint-disable-next-line
  const { useEffect } = require("react");
  
  useEffect(() => {
      if (!searchParams.get("mode") && !searchParams.get("preset") && !searchParams.get("month")) {
          // Force 3M
          const params = new URLSearchParams(searchParams.toString());
          params.set("mode", "PRESET");
          params.set("preset", "3M");
          
          const now = new Date();
          const start = subMonths(now, 3);
          
          params.set("startDate", start.toISOString());
          params.set("endDate", now.toISOString());
          
          router.replace(`?${params.toString()}`, { scroll: false });
      }
  }, [searchParams, router]);

  const handleModeChange = (mode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    
    // Clear other params
    params.delete("month");
    params.delete("week");
    params.delete("year");
    params.delete("startDate");
    params.delete("endDate");

    if (mode === "MONTH") {
        if (!params.get("month")) params.set("month", format(new Date(), "yyyy-MM"));
    } else if (mode === "WEEK") {
        if (!params.get("week")) params.set("week", format(new Date(), "yyyy-'W'II"));
    } else if (mode === "YEAR") {
        if (!params.get("year")) params.set("year", format(new Date(), "yyyy"));
    } else if (mode === "RANGE") {
        if (!params.get("startDate")) {
            // Default to last 30 days
            const end = new Date();
            const start = subDays(end, 30);
            params.set("startDate", start.toISOString());
            params.set("endDate", end.toISOString());
        }
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleParamChange = (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`?${params.toString()}`, { scroll: false });
  }
  


  const handleRangeSelect = (range: any) => {
      if (range?.from) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("startDate", range.from.toISOString());
          if (range.to) {
              params.set("endDate", range.to.toISOString());
          } else {
             params.delete("endDate");
          }
          router.push(`?${params.toString()}`, { scroll: false });
      }
  }



  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
      
      <div className="flex flex-wrap items-center gap-2">
        {/* Owner Filter */}
        {showOwnerFilter && (
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg mr-2 overflow-x-auto max-w-full scrollbar-hide">
            {OWNERS.map((owner) => (
                <Button
                    key={owner.value}
                    variant={currentOwner === owner.value ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                        "h-8 px-3 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                        currentOwner === owner.value 
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" 
                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    )}
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (owner.value === "ALL") params.delete("owner");
                        else params.set("owner", owner.value);
                        router.push(`?${params.toString()}`, { scroll: false });
                    }}
                >
                    {owner.label}
                </Button>
            ))}
        </div>
        )}

        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg overflow-x-auto max-w-full scrollbar-hide">
            {[
                { label: "MTD", value: "MTD", mtd: true },
                { label: "7D", value: "7D", days: 7 },
                { label: "1M", value: "1M", months: 1 },
                { label: "3M", value: "3M", months: 3 },
                { label: "YTD", value: "YTD", ytd: true },
                { label: "1Y", value: "1Y", years: 1 },
                { label: "ALL", value: "ALL" },
            ].map((preset) => (
                <Button
                    key={preset.value}
                    variant={
                        (currentMode === "PRESET" && searchParams.get("preset") === preset.value) ||
                        // Check MTD specifically if mode is MONTH and no month param (implies default current month which MTD represents)
                        // BUT only if we are not in the "default state" where defaultPreset might be something else.
                        // Actually, let's simplify:
                        // 1. If we have a 'preset' param, match it.
                        (currentMode === "PRESET" && searchParams.get("preset") === preset.value) ||
                        // 2. If we have no params at all, match defaultPreset
                        (!searchParams.get("mode") && !searchParams.get("preset") && !searchParams.get("month") && preset.value === defaultPreset) ||
                        // 3. Special case for MTD when mode is MONTH (legacy default) BUT we need to ensure we aren't in the empty-param state where defaultPreset rules.
                        // If defaultPreset is NOT MTD, then "MTD" button should only be active if user explicitly navigated to MTD (which sets mode=PRESET or mode=MONTH+current).
                        // If we use the logic: "If mode is MONTH and defaultPreset is MTD", it works.
                        (preset.value === "MTD" && currentMode === "MONTH" && !searchParams.get("month") && defaultPreset === "MTD")
                            ? "secondary" 
                            : "ghost"
                    }
                    size="sm"
                    className={cn(
                        "h-8 px-3 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                        (currentMode === "PRESET" && searchParams.get("preset") === preset.value) ||
                        (!searchParams.get("mode") && !searchParams.get("preset") && !searchParams.get("month") && preset.value === defaultPreset) ||
                        (preset.value === "MTD" && currentMode === "MONTH" && !searchParams.get("month") && defaultPreset === "MTD")
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" 
                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    )}
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("mode", "PRESET");
                        params.set("preset", preset.value);
                        
                        const now = new Date();
                        let start = now;
                        let end = now;

                        if (preset.days) start = subDays(now, preset.days);
                        if (preset.months) start = subMonths(now, preset.months);
                        if (preset.years) start = subDays(now, 365); // 1Y
                        if (preset.ytd) start = startOfYear(now);
                        if (preset.mtd) start = startOfMonth(now);
                        if (preset.value === "ALL") {
                             params.set("mode", "ALL");
                             params.delete("preset");
                             params.delete("startDate");
                             params.delete("endDate");
                        } else {
                            // Calculate explicit dates provided for backend consistency
                            params.set("startDate", start.toISOString());
                            params.set("endDate", end.toISOString());
                        }
                        
                         // Clear legacy params
                        params.delete("month");
                        params.delete("week");
                        params.delete("year");

                        router.push(`?${params.toString()}`, { scroll: false });
                    }}
                >
                    {preset.label}
                </Button>
            ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              size="sm"
              className={cn(
                "h-9 justify-start text-left font-normal ml-2",
                !currentStartDate && "text-muted-foreground",
                currentMode === "RANGE" && "border-primary ring-1 ring-primary"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentMode === "RANGE" && currentStartDate && currentEndDate ? (
                <>
                  {format(new Date(currentStartDate), "LLL dd, y")} -{" "}
                  {format(new Date(currentEndDate), "LLL dd, y")}
                </>
              ) : (
                <span>Custom</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={currentStartDate ? new Date(currentStartDate) : undefined}
              selected={{
                  from: currentStartDate ? new Date(currentStartDate) : undefined,
                  to: currentEndDate ? new Date(currentEndDate) : undefined
              }}
              onSelect={(range) => {
                  if (range?.from) {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("mode", "RANGE");
                      params.delete("preset");
                      params.delete("month");
                      params.delete("week");
                      params.delete("year");
                      
                      params.set("startDate", range.from.toISOString());
                      if (range.to) {
                          params.set("endDate", range.to.toISOString());
                      } else {
                          params.delete("endDate");
                      }
                      router.push(`?${params.toString()}`, { scroll: false });
                  }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
