"use client";

import { ChevronRight, Target, Share2, Wallet, TrendingDown, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function GoalStatus({ goals }: { goals: any[] }) {
  const activeGoals = goals.slice(0, 3);

  if (activeGoals.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
           Goals <Target className="w-4 h-4 text-zinc-500" />
        </h2>
        <Link 
            href="/goals" 
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
            View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {activeGoals.map((goal: any) => {
            const progress = goal.totalEstimated > 0 
                ? (goal.totalActual / goal.totalEstimated) * 100 
                : 0;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const remaining = Math.max(0, goal.totalEstimated - goal.totalActual);
            const goalColor = goal.color || '#6366f1';
            
            const formatCurrencyShort = (val: number) => {
               return new Intl.NumberFormat("id-ID", {
                   style: "currency",
                   currency: "IDR",
                   notation: "compact", // Compact notation for dashboard space
                   maximumFractionDigits: 1
               }).format(val);
            };
            
            return (
                <Link href={`/goals/${goal._id}`} key={goal._id} className="group relative block w-full">
                    <div 
                        className="relative overflow-hidden rounded-[24px] shadow-sm hover:shadow-lg transition-all duration-500 bg-card border border-border/50 group-hover:-translate-y-1 h-full"
                    >
                        {/* 1. Background Overlay (Color Tint) */}
                        <div 
                            className="absolute inset-0 opacity-[0.06] dark:opacity-[0.15] transition-opacity duration-500" 
                            style={{ backgroundColor: goalColor }} 
                        />
                        
                        {/* 2. Faint Watermark Icon */}
                        <div className="absolute -bottom-6 -right-6 opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[10deg]">
                            <span className="text-[120px] leading-none grayscale" style={{ color: goalColor }}>{goal.icon || "🎯"}</span>
                        </div>

                         {/* Card Content */}
                         <div className="p-5 relative z-10 flex flex-col h-full gap-4">
                             
                             {/* Header: Icon & Name */}
                             <div className="flex items-start gap-3">
                                 <div 
                                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl shadow-sm border border-black/5"
                                    style={{ backgroundColor: `${goalColor}15` }}
                                >
                                    {goal.icon || "🎯"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-base tracking-tight leading-tight truncate text-foreground group-hover:text-primary transition-colors">
                                        {goal.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                        Target: {format(new Date(goal.targetDate), "MMM yyyy")}
                                    </p>
                                </div>
                                {goal.visibility === "SHARED" && (
                                     <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 flex items-center gap-0.5">
                                        <Share2 className="w-2.5 h-2.5" />
                                     </span>
                                )}
                             </div>

                             {/* Use Compact Stats Layout */}
                             <div className="mt-auto space-y-3">
                                 <div className="flex justify-between items-end">
                                     <div>
                                         <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Collected</p>
                                         <div className="flex items-baseline gap-1.5">
                                             <p className="font-bold text-lg leading-none" style={{ color: goalColor }}>
                                                 {formatCurrencyShort(goal.totalActual)}
                                             </p>
                                             <p className="text-xs text-muted-foreground font-medium">
                                                 / {formatCurrencyShort(goal.totalEstimated)}
                                             </p>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Progress Bar */}
                                 <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                        <span className={remaining === 0 ? "text-emerald-600 font-bold" : ""}>
                                            {remaining === 0 ? "Completed! 🎉" : "Progress"}
                                        </span>
                                        <span>{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden p-[1px]">
                                          <div 
                                              className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-sm" 
                                              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goalColor }}
                                          >
                                              {progress < 100 && (
                                                 <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }} />
                                              )}
                                          </div>
                                      </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </Link>
            );
        })}
      </div>
    </section>
  );
}
