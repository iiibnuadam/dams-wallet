"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, History, AlertCircle, Target, TrendingDown, Calendar, Pencil, Share2, Wallet, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EditGoalDialog } from "@/components/GoalDialogs";
import { AddGoalItemDialog, EditGoalItemDialog, DeleteGoalItemDialog } from "@/components/GoalItemDialogs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalHistoryList } from "@/components/GoalHistoryList";
import { PayGoalItemDialog } from "@/components/PayGoalItemDialog";
import { cn } from "@/lib/utils";
import { EditGroupDialog } from "@/components/GroupDialogs";
import { useGoal } from "@/hooks/useGoals";
import { useWallets } from "@/hooks/useWallets";
import { useRouter } from "next/navigation";
import { GoalDetailSkeleton } from "@/components/skeletons";

interface GoalDetailViewProps {
    goalId: string;
}

interface GoalDetailViewProps {
    goalId: string;
}

export function GoalDetailView({ goalId }: GoalDetailViewProps) {
    const router = useRouter();
    const { data: goal, isLoading: isGoalLoading, error } = useGoal(goalId);
    const { data: wallets = [] } = useWallets("ALL");

    const [activeTab, setActiveTab] = useState("overview");
    const [historyFilter, setHistoryFilter] = useState<{ type: 'ALL' | 'GROUP' | 'ITEM', id?: string, name?: string }>({ type: 'ALL' });

    if (isGoalLoading) return <GoalDetailSkeleton />;
    if (error || !goal) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 opacity-50" />
            <h1 className="text-2xl font-bold">Goal not found</h1>
            <Button onClick={() => router.push("/goals")}>Back to Goals</Button>
        </div>
    );

    // Group items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupedItems = goal.items.reduce((acc: any, item: any) => {
        if (!acc[item.groupName]) {
        acc[item.groupName] = [];
        }
        acc[item.groupName].push(item);
        return acc;
    }, {});
    const groups = Object.keys(groupedItems);

    // Filter History Logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredHistory = goal.history?.filter((txn: any) => {
        if (historyFilter.type === 'ALL') return true;
        
        const txnItemId = typeof txn.goalItem === 'object' ? txn.goalItem?._id : txn.goalItem;

        if (historyFilter.type === 'ITEM') return txnItemId === historyFilter.id;
        if (historyFilter.type === 'GROUP') {
             // Find all items in this group
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const groupItems = groupedItems[historyFilter.id!]?.map((i: any) => i._id);
             return groupItems?.includes(txnItemId);
        }
        return true;
    });

    const handleFilter = (type: 'ALL' | 'GROUP' | 'ITEM', id?: string, name?: string) => {
        setHistoryFilter({ type, id, name });
        setActiveTab("history");
    };

    // Calculations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalEstimated = goal.items.reduce((sum: number, item: any) => sum + item.estimatedAmount, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalActual = goal.items.reduce((sum: number, item: any) => sum + item.actualAmount, 0);
    const overallProgress = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;
    const totalRemaining = Math.max(0, totalEstimated - totalActual);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        }).format(amount);
    };

    const goalColor = goal.color || '#6366f1';

    return (
        <div className="min-h-screen max-w-7xl pb-20 py-8 mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Navigation */}
        <div className="px-4">
             <Link href="/goals" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Goals
            </Link>
        </div>

        <div className="container sm:px-4 space-y-8">
            {/* GLASS + ICON BACKGROUND DESIGN */}
            <div className="px-4">
                <div 
                    className="relative overflow-hidden rounded-[32px] shadow-xl transition-all duration-500 group bg-card border-t border-white/10"
                >
                    {/* Background Layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/5" />
                    
                    {/* Color Overlay */}
                    <div 
                        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15]" 
                        style={{ backgroundColor: goalColor }} 
                    />
                    
                    {/* Faint Background Icon */}
                    <div className="absolute md:-bottom-10 -right-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                        <span className="text-[250px] leading-none grayscale" style={{ color: goalColor }}>
                            {goal.icon || "🎯"}
                        </span>
                    </div>

                    {/* Glass Content Layer */}
                    <div className="relative z-10 backdrop-blur-[2px]"> 
                        <div className="p-8 sm:p-10 flex flex-col h-full"> 
                            
                            {/* Header Row */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                                <div className="flex items-center gap-5">
                                    <div 
                                        className="md:w-20 md:h-20 w-16 h-16 rounded-[22px] flex items-center justify-center text-5xl shadow-sm border border-black/5"
                                        style={{ backgroundColor: `${goalColor}15` }}
                                    >
                                        {goal.icon || "🎯"}
                                    </div>
                                    <div className="space-y-1">
                                         <div className="flex items-center gap-3">
                                            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-sm">
                                                {goal.name}
                                            </h1>
                                            {goal.visibility === "SHARED" && (
                                                <div className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                                                    <Share2 className="w-3 h-3" /> Shared
                                                </div>
                                            )}
                                         </div>
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                            <Calendar className="w-4 h-4 opacity-70" />
                                            <span>Target: {format(new Date(goal.targetDate), "MMMM d, yyyy")}</span>
                                        </div>
                                    </div>
                                </div>
                                <EditGoalDialog goal={goal} trigger={
                                     <Button size="sm" variant="outline" className="bg-background/50 hover:bg-background/80 backdrop-blur-md shadow-sm">
                                        <Pencil className="w-4 h-4 mr-2" /> Edit Goal
                                     </Button>
                                 } />
                            </div>

                            {/* Main Stats Block */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-end">
                                
                                {/* Primary Metric: Collected */}
                                <div className="space-y-2">
                                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest pl-1">Total Collected</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 
                                            className="text-4xl xl:text-6xl font-black tracking-tighter"
                                            style={{ color: goalColor }}
                                        >
                                            {formatCurrency(totalActual)}
                                        </h2>
                                    </div>
                                    
                                     {/* Simple Progress Indicator */}
                                     {totalRemaining === 0 ? (
                                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 backdrop-blur-md">
                                             <CheckCircle2 className="w-5 h-5" />
                                             <span className="font-bold">Goal Completed! 🎉</span>
                                         </div>
                                     ) : (
                                         <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 border border-border/50 rounded-full text-muted-foreground text-sm backdrop-blur-md">
                                             <TrendingDown className="w-4 h-4" />
                                             <span>{overallProgress.toFixed(1)}% complete</span>
                                         </div>
                                     )}
                                </div>

                                {/* Secondary Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {/* Target Card */}
                                     <div className="bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl p-5 hover:bg-background/80 transition-colors">
                                         <div className="flex items-start justify-between mb-4">
                                             <div className="p-2 bg-muted/50 rounded-lg">
                                                 <Target className="w-5 h-5 text-muted-foreground" />
                                             </div>
                                             <span className="text-xs text-muted-foreground font-mono">TARGET</span>
                                         </div>
                                         <div>
                                             <p className="text-xl font-bold text-foreground tracking-tight">{formatCurrency(totalEstimated)}</p>
                                             <p className="text-xs text-muted-foreground mt-1">Total needed</p>
                                         </div>
                                     </div>

                                     {/* Shortfall Card */}
                                     <div className="bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl p-5 hover:bg-background/80 transition-colors relative overflow-hidden group/card">
                                         {totalRemaining > 0 ? (
                                             <>
                                                <div className="absolute inset-0 bg-red-500/5 opacity-100 transition-opacity" />
                                                <div className="flex items-start justify-between mb-4 relative z-10">
                                                    <div className="p-2 bg-muted/50 rounded-lg">
                                                        <Wallet className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground font-mono">REMAINING</span>
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-xl font-bold text-foreground tracking-tight">{formatCurrency(totalRemaining)}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                        To reach goal
                                                    </p>
                                                </div>
                                             </>
                                         ) : (
                                              <>
                                                 <div className="absolute inset-0 bg-emerald-500/5" />
                                                 <div className="flex items-center justify-center h-full flex-col text-emerald-600 pb-2 relative z-10">
                                                     <CheckCircle2 className="w-8 h-8 mb-2" />
                                                     <p className="font-bold">All Set!</p>
                                                 </div>
                                              </>
                                         )}
                                     </div>
                                </div>
                            </div>

                            {/* Bottom Progress Bar */}
                            <div className="mt-10">
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className="h-full shadow-sm rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min(overallProgress, 100)}%`, backgroundColor: goalColor }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 h-full skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-4">
                    <TabsList className="bg-muted/50 p-1 rounded-full border border-border/50 h-auto inline-flex mb-6">
                        <TabsTrigger value="overview" className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Overview</TabsTrigger>
                        <TabsTrigger value="history" className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
                            History
                            {historyFilter.type !== 'ALL' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                        </TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 focus-visible:outline-none">
                    {/* Goal Items */}
                    <div className="px-4">
                        <div className="flex items-center justify-between mb-4">
                             <h3 className="font-bold text-xl tracking-tight flex items-center gap-2">
                                Budget Breakdown
                            </h3>
                            <AddGoalItemDialog goalId={goal._id} existingGroups={groups} />
                        </div>

                        <Accordion type="multiple" defaultValue={groups} className="space-y-4">
                            {groups.map((group) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const items = groupedItems[group];
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const groupTotal = items.reduce((sum: number, i: any) => sum + i.actualAmount, 0);
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const groupEstimated = items.reduce((sum: number, i: any) => sum + i.estimatedAmount, 0);
                                const groupRemaining = Math.max(0, groupEstimated - groupTotal);
                                const isOverBudget = groupTotal > groupEstimated;

                                // Get Group Metadata
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const groupMeta = goal.groups?.find((g: any) => g.name === group);
                                const groupColor = groupMeta?.color || goal.color || "#6366f1";
                                const groupIcon = groupMeta?.icon || "📁";

                                return (
                                    <AccordionItem 
                                        key={group} 
                                        value={group} 
                                        className="border rounded-2xl px-1 overflow-hidden transition-all duration-300 bg-card/50 hover:bg-card/80"
                                        style={{ borderColor: `${groupColor}30` }}
                                    >
                                        <div className="relative">
                                             <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: groupColor }} />
                                            <AccordionTrigger className="hover:no-underline py-4 px-4 pl-6">
                                                <div className="flex-1 text-left mr-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="font-bold text-lg flex items-center gap-2">
                                                                <span className="text-xl opacity-80">{groupIcon}</span>
                                                                <span>{group}</span>
                                                                 <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <EditGroupDialog 
                                                                        goalId={goal._id} 
                                                                        group={{ name: group, color: groupMeta?.color, icon: groupMeta?.icon }} 
                                                                    />
                                                                </div>
                                                            </div>
                                                            {groupRemaining > 0 ? (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Needs <span className="font-semibold text-foreground">{formatCurrency(groupRemaining)}</span> more
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-emerald-600 font-medium">Fully Funded</span>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={cn("text-base font-bold", isOverBudget ? 'text-red-500' : 'text-emerald-600')}>
                                                                {formatCurrency(groupTotal)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground font-medium">
                                                                of {formatCurrency(groupEstimated)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Custom Progress Bar */}
                                                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full transition-all duration-500 rounded-full relative"
                                                            style={{ 
                                                                width: `${groupEstimated > 0 ? Math.min((groupTotal / groupEstimated) * 100, 100) : 0}%`,
                                                                backgroundColor: isOverBudget ? '#ef4444' : groupColor 
                                                            }}
                                                        >
                                                            {groupRemaining === 0 && <div className="absolute inset-0 bg-white/20" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                        </div>
                                        
                                        <AccordionContent className="pb-4 pt-1 px-4 pl-6 space-y-3">
                                            {/* Group Actions */}
                                            <div className="flex justify-end mb-2">
                                                 <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-7 text-xs text-muted-foreground hover:text-primary gap-1.5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFilter('GROUP', group, group);
                                                    }}
                                                >
                                                    <History className="w-3.5 h-3.5" /> View Group History
                                                </Button>
                                            </div>

                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {items.map((item: any) => {
                                                const progress = item.estimatedAmount > 0 ? (item.actualAmount / item.estimatedAmount) * 100 : 0;
                                                const isItemOver = item.actualAmount > item.estimatedAmount;
                                                const isPaid = progress >= 100;
                                                const itemRemaining = Math.max(0, item.estimatedAmount - item.actualAmount);

                                                return (
                                                    <div key={item._id} className="bg-background/80 backdrop-blur-sm border rounded-xl p-4 space-y-4 shadow-sm hover:shadow-md transition-all group/item relative">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold flex items-center gap-2 text-base">
                                                                    {item.name}
                                                                    {isPaid && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                                    <div className="ml-2 flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                        <EditGoalItemDialog goalId={goal._id} item={item} existingGroups={groups} />
                                                                        <DeleteGoalItemDialog goalId={goal._id} itemId={item._id} itemName={item.name} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col md:flex-row flex-reverse md:flex-normal gap-3 mt-3 md:mt-1 md:items-center">
                                                                     <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded w-fit md:w-auto">
                                                                        Target: {formatCurrency(item.estimatedAmount)}
                                                                    </div>
                                                                    {itemRemaining > 0 && (
                                                                         <div className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                                            <TrendingDown className="w-3 h-3" />
                                                                            -{formatCurrency(itemRemaining)}
                                                                         </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={cn("font-bold text-lg", isItemOver ? "text-red-600" : "text-emerald-600")}>
                                                                    {formatCurrency(item.actualAmount)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <Progress 
                                                                value={Math.min(progress, 100)} 
                                                                className="h-2.5 flex-1"
                                                                indicatorClassName={isItemOver ? "bg-red-500" : "bg-emerald-500"}
                                                            />
                                                            <div className="text-xs font-bold w-10 text-right">{progress.toFixed(0)}%</div>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-2 border-t border-dashed">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 text-xs text-muted-foreground hover:text-primary pl-0 hover:bg-transparent"
                                                                onClick={() => handleFilter('ITEM', item._id, item.name)}
                                                            >
                                                                <History className="w-3.5 h-3.5 mr-1.5" /> Recent Activity
                                                            </Button>

                                                            <PayGoalItemDialog 
                                                                goalName={goal.name}
                                                                item={item}
                                                                wallets={wallets as any[]}
                                                                trigger={
                                                                    <Button size="sm" className="h-8 text-xs font-medium px-4 shadow-sm hover:shadow-md transition-all">
                                                                        + Pay
                                                                    </Button>
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2 duration-500 px-4">
                    <div className="space-y-6">
                        {/* Filter Controls */}
                        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar items-center">
                            <span className="text-xs font-medium text-muted-foreground mr-2 uppercase tracking-wider">Filter:</span>
                            <Button 
                                variant={historyFilter.type === 'ALL' ? "default" : "outline"} 
                                size="sm" 
                                className="rounded-full h-8 text-xs"
                                onClick={() => handleFilter('ALL')}
                            >
                                All History
                            </Button>
                            {/* Group Filters */}
                            {groups.map((group) => {
                                 const isActive = historyFilter.type === 'GROUP' && historyFilter.id === group;
                                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                 const groupMeta = goal.groups?.find((g: any) => g.name === group);
                                 return (
                                    <Button
                                        key={group}
                                        variant={isActive ? "default" : "outline"}
                                        size="sm"
                                        className="rounded-full h-8 text-xs whitespace-nowrap border-dashed"
                                        style={isActive ? { backgroundColor: groupMeta?.color } : { color: groupMeta?.color, borderColor: groupMeta?.color ? `${groupMeta.color}60` : undefined }}
                                        onClick={() => handleFilter('GROUP', group, group)}
                                    >
                                       {groupMeta?.icon || "📁"} {group}
                                    </Button>
                                 );
                            })}
                        </div>
                        
                        <div className="overflow-hidden">
                             <GoalHistoryList 
                                history={filteredHistory || []} 
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                itemColorMap={goal.items.reduce((acc: any, item: any) => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const groupMeta = goal.groups?.find((g: any) => g.name === item.groupName);
                                    acc[item._id] = groupMeta?.color || goal.color || "#6366f1";
                                    return acc;
                                }, {})}
                            />
                             {(filteredHistory?.length || 0) === 0 && (
                                <div className="text-center py-16 text-muted-foreground bg-muted/10">
                                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                    <p className="font-medium">No transactions found</p>
                                    <p className="text-xs opacity-60">Try changing filters or add a transaction</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

        </div>
        </div>
    );
}
