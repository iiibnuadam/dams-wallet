"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, CircleDollarSign, History, AlertCircle, Target, TrendingDown, Wallet, Calendar, Pencil } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Badge } from "@/components/ui/badge";
import { EditGoalDialog } from "@/components/GoalDialogs";
import { AddGoalItemDialog, EditGoalItemDialog, DeleteGoalItemDialog } from "@/components/GoalItemDialogs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalHistoryList } from "@/components/GoalHistoryList";
import { PayGoalItemDialog } from "@/components/PayGoalItemDialog";
import { cn } from "@/lib/utils";
import { EditGroupDialog } from "@/components/GroupDialogs";

interface GoalDetailViewProps {
    goal: any;
    wallets: any[];
}

export function GoalDetailView({ goal, wallets }: GoalDetailViewProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [historyFilter, setHistoryFilter] = useState<{ type: 'ALL' | 'GROUP' | 'ITEM', id?: string, name?: string }>({ type: 'ALL' });

    // Group items
    const groupedItems = goal.items.reduce((acc: any, item: any) => {
        if (!acc[item.groupName]) {
        acc[item.groupName] = [];
        }
        acc[item.groupName].push(item);
        return acc;
    }, {});
    const groups = Object.keys(groupedItems);

    // Filter History Logic
    const filteredHistory = goal.history?.filter((txn: any) => {
        if (historyFilter.type === 'ALL') return true;
        if (historyFilter.type === 'ITEM') return txn.goalItem === historyFilter.id;
        if (historyFilter.type === 'GROUP') {
             // Find all items in this group
             const groupItems = groupedItems[historyFilter.id!]?.map((i: any) => i._id);
             return groupItems?.includes(txn.goalItem);
        }
        return true;
    });

    const handleFilter = (type: 'ALL' | 'GROUP' | 'ITEM', id?: string, name?: string) => {
        setHistoryFilter({ type, id, name });
        setActiveTab("history");
    };

    // Calculations
    const totalEstimated = goal.items.reduce((sum: number, item: any) => sum + item.estimatedAmount, 0);
    const totalActual = goal.items.reduce((sum: number, item: any) => sum + item.actualAmount, 0);
    const overallProgress = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;
    const totalRemaining = Math.max(0, totalEstimated - totalActual);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen max-w-7xl pb-20 py-8 mx-auto">
        <Link href="/goals" className="px-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Goals
        </Link>

        <div className="container sm:px-4 py-2 space-y-8">
            {/* Overall Status Card - Gestalt Redesign */}
            <div className="px-4">
            <div 
                className="rounded-3xl text-white shadow-2xl relative overflow-hidden transition-all duration-500 group"
                style={{ 
                    background: `linear-gradient(145deg, ${goal.color || '#6366f1'}, ${goal.color ? goal.color + 'dd' : '#7c3aed'})`,
                    boxShadow: `0 25px 50px -12px ${goal.color}60`
                }}
            >
                {/* Background Atmosphere */}
                <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-white/20 rounded-full blur-[80px] opacity-60" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-black/20 rounded-full blur-[60px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />

                <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full">
                    
                    {/* Top Section: Identity & Actions (Proximity) */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-lg border border-white/20">
                                {goal.icon || "🎯"}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 shadow-sm">{goal.name}</h1>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <Calendar className="w-4 h-4 opacity-80" />
                                    <span>{format(new Date(goal.targetDate), "dd MMM yyyy")}</span>
                                </div>
                            </div>
                        </div>
                         <EditGoalDialog goal={goal} trigger={
                             <Button size="icon" variant="ghost" className="h-10 w-10 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                                <Pencil className="w-5 h-5" />
                             </Button>
                         } />
                    </div>

                    {/* Middle Section: Core Metric (Hierarchy) */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-4 mb-8">
                        <span className="text-white/80 text-xs font-bold uppercase tracking-[0.2em] mb-3">Total Collected</span>
                        <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter drop-shadow-md leading-none">
                            {formatCurrency(totalActual)}
                        </h2>
                    </div>

                    {/* Integrated Progress Bar (Continuity) */}
                    <div className="space-y-3 mb-8">
                         <div className="flex justify-between items-end px-1">
                            <span className="text-sm font-medium text-white/90">{overallProgress.toFixed(0)}% Achieved</span>
                            <span className="text-xs text-white/70 uppercase tracking-wider font-semibold">Progress</span>
                        </div>
                        <div className="h-4 bg-black/20 backdrop-blur-md rounded-full overflow-hidden border border-white/10 p-1">
                             <div 
                                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(overallProgress, 100)}%` }}
                             />
                        </div>
                    </div>

                    {/* Bottom Section: Secondary MetricsGrid (Common Region) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col items-center sm:items-start transition-colors hover:bg-black/30">
                            <span className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Goal Target</span>
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-white/80" />
                                <span className="text-lg sm:text-xl font-bold text-white/95">{formatCurrency(totalEstimated)}</span>
                            </div>
                        </div>
                         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center sm:items-start transition-colors hover:bg-white/20 relative overflow-hidden">
                            {totalRemaining > 0 ? (
                                <>
                                    <span className="text-red-100/80 text-xs font-bold uppercase tracking-wider mb-1">Shortfall</span>
                                     <div className="flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-red-100" />
                                        <span className="text-lg sm:text-xl font-bold text-white">{formatCurrency(totalRemaining)}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="text-emerald-100/80 text-xs font-bold uppercase tracking-wider mb-1">Status</span>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                                        <span className="text-lg sm:text-xl font-bold text-white">Completed!</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="history">
                        History
                        {historyFilter.type !== 'ALL' && <span className="w-2 h-2 rounded-full bg-primary ml-2 animate-pulse" />}
                    </TabsTrigger>
                </TabsList>
              </div>
                
                <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Goal Items */}
                    <div className="space-y-4 bg-background rounded-xl p-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Budget Breakdown
                            <AddGoalItemDialog goalId={goal._id} existingGroups={groups} />
                            <Badge variant="outline" className="ml-auto text-xs font-normal">
                                {goal.items.length} Items
                            </Badge>
                        </h3>

                        <Accordion type="multiple" defaultValue={groups} className="w-full space-y-4">
                            {groups.map((group) => {
                                const items = groupedItems[group];
                                const groupTotal = items.reduce((sum: number, i: any) => sum + i.actualAmount, 0);
                                const groupEstimated = items.reduce((sum: number, i: any) => sum + i.estimatedAmount, 0);
                                const groupRemaining = Math.max(0, groupEstimated - groupTotal);
                                const isOverBudget = groupTotal > groupEstimated;

                                // Get Group Metadata
                                const groupMeta = goal.groups?.find((g: any) => g.name === group);
                                const groupColor = groupMeta?.color || goal.color || "#6366f1";
                                const groupIcon = groupMeta?.icon || "📁";

                                return (
                                    <AccordionItem 
                                        key={group} 
                                        value={group} 
                                        className="border rounded-xl px-4 mb-3 overflow-hidden transition-all duration-300"
                                        style={{ 
                                            borderColor: `${groupColor}50`,
                                            backgroundColor: `${groupColor}10` 
                                        }}
                                    >
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex-1 text-left mr-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-semibold flex items-center gap-2">
                                                            <span className="text-xl">{groupIcon}</span>
                                                            <span style={{ color: groupColor }}>{group}</span>
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <EditGroupDialog 
                                                                    goalId={goal._id} 
                                                                    group={{ name: group, color: groupMeta?.color, icon: groupMeta?.icon }} 
                                                                />
                                                            </div>
                                                        </div>
                                                        {groupRemaining > 0 && (
                                                            <div className="text-[10px] text-muted-foreground mt-0.5 ml-8">
                                                                Remaining: <span className="text-red-500 font-medium">{formatCurrency(groupRemaining)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-sm font-medium ${isOverBudget ? 'text-red-500' : 'text-emerald-600'}`}>
                                                            {formatCurrency(groupTotal)}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            Target: {formatCurrency(groupEstimated)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden ml-8 w-[calc(100%-2rem)]">
                                                    <div 
                                                        className="h-full transition-all duration-500 rounded-full"
                                                        style={{ 
                                                            width: `${groupEstimated > 0 ? Math.min((groupTotal / groupEstimated) * 100, 100) : 0}%`,
                                                            backgroundColor: isOverBudget ? '#ef4444' : groupColor 
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4 pt-1 space-y-3">
                                            {/* Group Actions */}
                                            <div className="flex justify-end mb-2">
                                                 <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFilter('GROUP', group, group);
                                                    }}
                                                >
                                                    <History className="w-3 h-3" /> View Group History
                                                </Button>
                                            </div>

                                            {items.map((item: any) => {
                                                const progress = item.estimatedAmount > 0 ? (item.actualAmount / item.estimatedAmount) * 100 : 0;
                                                const isItemOver = item.actualAmount > item.estimatedAmount;
                                                const isPaid = progress >= 100;
                                                const itemRemaining = Math.max(0, item.estimatedAmount - item.actualAmount);

                                                return (
                                                    <div key={item._id} className="bg-background border rounded-lg p-3 space-y-3 group relative">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-medium flex items-center gap-2">
                                                                    {item.name}
                                                                    {isPaid && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                                                    <div className="ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <EditGoalItemDialog goalId={goal._id} item={item} existingGroups={groups} />
                                                                        <DeleteGoalItemDialog goalId={goal._id} itemId={item._id} itemName={item.name} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 mt-0.5">
                                                                     <div className="text-xs text-muted-foreground">
                                                                        Est: {formatCurrency(item.estimatedAmount)}
                                                                    </div>
                                                                    {itemRemaining > 0 && (
                                                                         <div className="text-xs text-red-500 font-medium">
                                                                            (-{formatCurrency(itemRemaining)})
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`font-semibold text-sm ${isItemOver ? "text-red-600" : "text-emerald-600"}`}>
                                                                    {formatCurrency(item.actualAmount)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <Progress 
                                                                value={Math.min(progress, 100)} 
                                                                className="h-2 flex-1"
                                                                indicatorClassName={isItemOver ? "bg-red-500" : "bg-emerald-500"}
                                                            />
                                                            <div className="text-xs font-medium w-9 text-right">{progress.toFixed(0)}%</div>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-7 text-xs px-2 -ml-2 text-muted-foreground hover:text-primary"
                                                                onClick={() => handleFilter('ITEM', item._id, item.name)}
                                                            >
                                                                <History className="w-3 h-3 mr-1" /> History
                                                            </Button>

                                                            <PayGoalItemDialog 
                                                                goalName={goal.name}
                                                                item={item}
                                                                wallets={wallets}
                                                                trigger={
                                                                    <Button variant="outline" size="sm" className="h-7 text-xs">
                                                                        + Pay / Cicil
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

                <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-4 bg-background rounded-xl p-4">
                        {/* Filter Controls */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            <Button 
                                variant={historyFilter.type === 'ALL' ? "default" : "outline"} 
                                size="sm" 
                                className="h-8 rounded-full"
                                onClick={() => handleFilter('ALL')}
                            >
                                All
                            </Button>
                            {/* Group Filters */}
                            {groups.map((group) => {
                                 const isActive = historyFilter.type === 'GROUP' && historyFilter.id === group;
                                 const groupMeta = goal.groups?.find((g: any) => g.name === group);
                                 return (
                                    <Button
                                        key={group}
                                        variant={isActive ? "default" : "outline"}
                                        size="sm"
                                        className="h-8 rounded-full whitespace-nowrap"
                                        style={isActive ? { backgroundColor: groupMeta?.color } : { color: groupMeta?.color, borderColor: groupMeta?.color ? `${groupMeta.color}40` : undefined }}
                                        onClick={() => handleFilter('GROUP', group, group)}
                                    >
                                       {groupMeta?.icon || "📁"} {group}
                                    </Button>
                                 );
                            })}
                        </div>
                        <GoalHistoryList 
                            history={filteredHistory || []} 
                            itemColorMap={goal.items.reduce((acc: any, item: any) => {
                                const groupMeta = goal.groups?.find((g: any) => g.name === item.groupName);
                                acc[item._id] = groupMeta?.color || goal.color || "#6366f1";
                                return acc;
                            }, {})}
                        />
                         {(filteredHistory?.length || 0) === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p>No transaction history found</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

        </div>
        </div>
    );
}
