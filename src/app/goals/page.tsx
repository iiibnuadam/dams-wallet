import { getGoals } from "@/services/goal.service";
import Link from "next/link";
import { format } from "date-fns";
import { Target } from "lucide-react";
import { AddGoalDialog } from "@/components/GoalDialogs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);
  // Pass current user name/id. Assuming owner is stored as "name" or username.
  // Goal service expects string.
  const goals = await getGoals(session?.user?.name || undefined);

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    Financial Goals
                    <Target className="w-6 h-6" />
                </h1>
                <p className="text-muted-foreground">Track and manage your savings targets.</p>
            </div>
            <AddGoalDialog />
        </div>

        <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No goals found.</p>
            <p className="text-xs">Create one to start tracking!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  <Link href={`/goals/${goal._id}`} key={goal._id} className="group relative block w-full">
                    {/* Card Container with Modern Gradient Border/Glow effect on hover */}
                    <div 
                        className="relative overflow-hidden rounded-[24px] border bg-card text-card-foreground shadow-sm transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group-hover:-translate-y-1 h-full"
                    >
                        {/* Dynamic Background Gradient */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500" 
                            style={{ background: `linear-gradient(135deg, ${goalColor}, transparent)` }} 
                        />
                        
                        {/* Decorative Icon Background */}
                        <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110">
                            <span className="text-[180px] leading-none select-none grayscale">{goal.icon || "🎯"}</span>
                        </div>

                        <div className="p-6 relative z-10 flex flex-col h-full">
                             {/* Header Section */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex gap-4 items-center">
                                    <div 
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-black/5 transition-transform group-hover:scale-105"
                                        style={{ backgroundColor: `${goalColor}15` }}
                                    >
                                        {goal.icon || "🎯"}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl tracking-tight leading-tight mb-1 group-hover:text-primary transition-colors">
                                            {goal.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <span className="bg-muted px-2 py-0.5 rounded-md">
                                                {format(new Date(goal.targetDate), "MMM yyyy")}
                                            </span>
                                            {goal.visibility === "SHARED" && (
                                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">
                                                    Shared
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 shadow-sm">
                                    <p className="text-[10px] text-emerald-600/80 uppercase font-bold tracking-wider mb-0.5">Collected</p>
                                    <p className="font-bold text-lg text-emerald-700">
                                        {formatCurrencyShort(goal.totalActual)}
                                    </p>
                                </div>
                                
                                <div className="bg-muted/40 p-3 rounded-2xl border border-black/5">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Target</p>
                                    <p className="font-bold text-lg text-muted-foreground">
                                        {formatCurrencyShort(goal.totalEstimated)}
                                    </p>
                                </div>
                            </div>

                            {/* Lacking / Shortfall Emphasis */}
                            {remaining > 0 && (
                                <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 shadow-sm mb-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-red-600/80 uppercase font-bold tracking-wider">Lacking</p>
                                        <p className="text-xs text-red-600/70 font-medium">To reach target</p>
                                    </div>
                                    <p className="font-bold text-xl text-red-600">
                                        -{formatCurrencyShort(remaining)}
                                    </p>
                                </div>
                            )}
                            {remaining === 0 && (
                                <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 shadow-sm mb-6 flex items-center justify-center gap-2">
                                    <p className="font-bold text-emerald-600">All Paid! 🎉</p>
                                </div>
                            )}

                            {/* Progress Section */}
                            <div className="mt-auto space-y-3">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className={remaining > 0 ? "text-muted-foreground" : "text-emerald-600"}>
                                        {remaining > 0 ? "In Progress" : "Completed! 🎉"}
                                    </span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden p-[2px]">
                                    <div 
                                        className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden" 
                                        style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goalColor }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </Link>
               );
            })}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
