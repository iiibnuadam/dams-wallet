"use client";

import { useGoals } from "@/hooks/useGoals";
import Link from "next/link";
import { format } from "date-fns";
import { Target, Calendar, Share2, Wallet, TrendingDown, CheckCircle2, Loader2 } from "lucide-react";
import { GoalListSkeleton } from "@/components/skeletons";

export function GoalList() {
    const { data: rawGoals, isLoading } = useGoals();
    const goals = Array.isArray(rawGoals) ? rawGoals : [];

    if (isLoading) {
        return <GoalListSkeleton />;
    }

    if (!Array.isArray(rawGoals) && !isLoading) {
        // If data is not array (e.g. HTML error), render error state or empty
        console.error("GoalList: Data is not an array", rawGoals);
    }

    if (goals.length === 0) {
        return (
          <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-3xl border border-dashed">
            <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No goals found</p>
            <p className="text-sm opacity-70">Create a new goal to start your journey!</p>
          </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-500">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {goals.map((goal: any) => {
               const progress = goal.totalEstimated > 0 ? (goal.totalActual / goal.totalEstimated) * 100 : 0;
               const remaining = Math.max(0, goal.totalEstimated - goal.totalActual);
               const goalColor = goal.color || '#6366f1';

               const formatCurrencyShort = (val: number) => {
                   return new Intl.NumberFormat("id-ID", {
                       style: "currency",
                       currency: "IDR",
                       notation: "compact",
                       maximumFractionDigits: 1
                   }).format(val);
               };

               return (
                  <Link href={`/goals/${goal._id}`} key={goal._id} className="group relative block w-full h-full">
                    <div 
                        className="relative overflow-hidden rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 bg-card border border-border/50 h-full group-hover:scale-[1.01]"
                    >
                        {/* 1. Background Overlay (Color Tint) */}
                        <div 
                            className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15] transition-opacity duration-500" 
                            style={{ backgroundColor: goalColor }} 
                        />
                        
                        {/* 2. Faint Watermark Icon */}
                        <div className="absolute -bottom-8 -right-8 opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[10deg]">
                            <span className="text-[200px] leading-none grayscale" style={{ color: goalColor }}>{goal.icon || "🎯"}</span>
                        </div>

                        {/* 3. Card Content */}
                        <div className="p-7 relative z-10 flex flex-col h-full backdrop-blur-[0px]">
                            
                            {/* Header: Icon + Title + Date */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex gap-5 items-center">
                                    <div 
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-black/5"
                                        style={{ backgroundColor: `${goalColor}15` }}
                                    >
                                        {goal.icon || "🎯"}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-2xl tracking-tight leading-tight mb-1.5 text-foreground">
                                            {goal.name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                             <div className="flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-md border border-border/50">
                                                <Calendar className="w-3.5 h-3.5 opacity-70" />
                                                <span>{format(new Date(goal.targetDate), "MMM yyyy")}</span>
                                             </div>
                                            {goal.visibility === "SHARED" && (
                                                <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-1">
                                                    <Share2 className="w-3 h-3" /> Shared
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Stat: Collected */}
                            <div className="mb-6 px-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1 pl-1">Collected</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="font-black text-4xl md:text-5xl tracking-tighter" style={{ color: goalColor }}>
                                        {formatCurrencyShort(goal.totalActual)}
                                    </p>
                                    <span className="text-sm font-medium text-muted-foreground">
                                         of {formatCurrencyShort(goal.totalEstimated)}
                                    </span>
                                </div>
                            </div>

                            {/* Secondary Stats Grid (Glass Cards) */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {/* Remaining */}
                                <div className="bg-background/60 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group/stat">
                                     {remaining > 0 ? (
                                        <>
                                            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Remaining</span>
                                                    <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                                                </div>
                                                <p className="font-bold text-lg text-foreground flex items-center gap-1.5">
                                                     {formatCurrencyShort(remaining)}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-red-500 font-medium">
                                                    <TrendingDown className="w-3 h-3" />
                                                    <span>Left to go</span>
                                                </div>
                                            </div>
                                        </>
                                     ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-1 text-emerald-600">
                                            <CheckCircle2 className="w-6 h-6 mb-1" />
                                            <span className="font-bold text-sm">Done!</span>
                                        </div>
                                     )}
                                </div>

                                {/* Progress Info */}
                                <div className="bg-background/60 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-center">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Progress</span>
                                    <div className="flex items-baseline gap-1">
                                         <span className="text-2xl font-bold text-foreground">{progress.toFixed(0)}</span>
                                         <span className="text-sm font-medium text-muted-foreground">%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className="h-full rounded-full"
                                            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goalColor }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Bottom Progress Bar (Visual Flair) */}
                            <div className="mt-auto pt-2">
                                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-sm" 
                                        style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goalColor }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 h-full skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                  </Link>
               );
            })}
        </div>
    );
}
