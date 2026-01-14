

"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, History, AlertCircle, Target, TrendingDown, Calendar, Pencil, Share2, Wallet, Plus, Trash2 } from "lucide-react";
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
import { EditGroupDialog, AddGroupDialog } from "@/components/GroupDialogs";
import { useGoal } from "@/hooks/useGoals";
import { useWallets } from "@/hooks/useWallets";
import { useRouter } from "next/navigation";
import { GoalDetailSkeleton } from "@/components/skeletons";

interface GoalDetailViewProps {
    goalId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoalGroup = { _id: string; name: string; color?: string; icon?: string; parentGroupId?: string };

interface GroupNode extends GoalGroup {
    children: GroupNode[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
    totalEstimated: number;
    totalActual: number;
    totalItemCount: number;
}

export function GoalDetailView({ goalId }: GoalDetailViewProps) {
    const router = useRouter();
    const { data: goal, isLoading: isGoalLoading, error } = useGoal(goalId);
    const { data: wallets = [] } = useWallets("ALL");

    const [activeTab, setActiveTab] = useState("overview");
    const [historyFilter, setHistoryFilter] = useState<{ type: 'ALL' | 'GROUP' | 'ITEM', id?: string, name?: string }>({ type: 'ALL' });
    const [isEditMode, setIsEditMode] = useState(false);

    // Build the Tree
    const rootNodes = useMemo(() => {
        if (!goal) return [];

        const groupMap = new Map<string, GroupNode>();
        // 1. Initialize nodes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (goal.groups || []).forEach((g: any) => {
            groupMap.set(g._id, { ...g, children: [], items: [], totalEstimated: 0, totalActual: 0, totalItemCount: 0 });
        });

        // 2. Assign Items to Groups
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orphanItems: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (goal.items || []).forEach((item: any) => {
            if (item.groupId && groupMap.has(item.groupId)) {
                groupMap.get(item.groupId)!.items.push(item);
            } else if (item.groupName) {
                // Legacy Fallback: Try to find group by name
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const groupByGenericName = Array.from(groupMap.values()).find((g: any) => g.name === item.groupName);
                if (groupByGenericName) {
                    groupByGenericName.items.push(item);
                } else {
                    orphanItems.push(item);
                }
            } else {
                orphanItems.push(item);
            }
        });

        // 3. Build Hierarchy
        const roots: GroupNode[] = [];
        groupMap.forEach((node) => {
            if (node.parentGroupId && groupMap.has(node.parentGroupId)) {
                groupMap.get(node.parentGroupId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // 4. Calculate Totals (Recursive Rollup)
        const calculateTotals = (node: GroupNode) => {
             // Sum direct items
             let estimated = node.items.reduce((acc, i) => acc + i.estimatedAmount, 0);
             let actual = node.items.reduce((acc, i) => acc + i.actualAmount, 0);
             let itemCount = node.items.length;

             // Sum children
             node.children.forEach(child => {
                 calculateTotals(child);
                 estimated += child.totalEstimated;
                 actual += child.totalActual;
                 itemCount += child.totalItemCount;
             });

             node.totalEstimated = estimated;
             node.totalActual = actual;
             node.totalItemCount = itemCount;
        };

        roots.forEach(calculateTotals);

        // Verify if we have orphans, maybe create a virtual unassigned group?
        if (orphanItems.length > 0) {
             const unassignedNode: GroupNode = {
                 _id: "unassigned",
                 name: "Unassigned",
                 color: "#94a3b8",
                 icon: "❓",
                 children: [],
                 items: orphanItems,
                 totalEstimated: orphanItems.reduce((acc, i) => acc + i.estimatedAmount, 0),
                 totalActual: orphanItems.reduce((acc, i) => acc + i.actualAmount, 0),
                 totalItemCount: orphanItems.length
             };
             roots.push(unassignedNode);
        }

        return roots;
    }, [goal]);

    if (isGoalLoading) return <GoalDetailSkeleton />;
    if (error || !goal) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 opacity-50" />
            <h1 className="text-2xl font-bold">Goal not found</h1>
            <Button onClick={() => router.push("/goals")}>Back to Goals</Button>
        </div>
    );

    // Filter History Logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredHistory = goal.history?.filter((txn: any) => {
        if (historyFilter.type === 'ALL') return true;
        
        const txnItemId = typeof txn.goalItem === 'object' ? txn.goalItem?._id : txn.goalItem;

        if (historyFilter.type === 'ITEM') return txnItemId === historyFilter.id;
        if (historyFilter.type === 'GROUP') {
             // TODO: Robust Group Filtering (including subgroups?)
             // For now simple match
             return true; 
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


    // Recursive Group Renderer
    const GroupRenderer = ({ node, level = 0 }: { node: GroupNode, level?: number }) => {
        const groupRemaining = Math.max(0, node.totalEstimated - node.totalActual);
        const isOverBudget = node.totalActual > node.totalEstimated;
        
        // Shared Column Widths
        const COL_PROGRESS = "w-[150px]";
        const COL_AMOUNT = "w-auto md:w-[130px]"; // Responsive width
        const COL_ACTIONS = "w-[40px]"; // For hover buttons

        return (
            <AccordionItem 
                value={node._id} 
                className={cn(
                    "border-none mb-6 rounded-2xl overflow-hidden shadow-xl shadow-black/5 transition-all duration-300",
                    // Glassmorphism Card Style for Top Level
                    level === 0 
                        ? "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10" 
                        : "bg-transparent shadow-none"
                )}
            >
                <div className="relative group/accordion-trigger w-full">
                    <div className="flex w-full items-stretch">
                        {/* Indentation Spacer */}
                        {level > 0 && (
                            <div 
                                className="shrink-0 border-r border-white/10 block" 
                                style={{ width: `${level * 1.5}rem` }} 
                            />
                        )}
                        
                        {/* Indicator Strip */}
                        <div className="w-1.5 shrink-0" style={{ backgroundColor: node.color || goalColor }} />

                        <AccordionTrigger className={cn(
                            "hover:no-underline pl-4 pr-5 flex-1 relative overflow-hidden group/header transition-all w-full",
                            // Glass Header Style
                            level === 0 
                                ? "bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 py-4" 
                                : "bg-white/5 hover:bg-white/10 dark:bg-white/[0.02] dark:hover:bg-white/5 py-3"
                        )}>
                            <div className="flex-1 flex flex-col min-w-0 gap-1.5 md:gap-0 w-full">
                                {/* Top Row / Desktop Main Row */}
                                <div className="flex items-center gap-4 w-full">
                                    {/* Left: Identity */}
                                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                        <div className={cn(
                                            "rounded-xl flex items-center justify-center shadow-sm border border-white/20 shrink-0 backdrop-blur-md transition-all",
                                            "bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5",
                                            // Smaller icon for nested groups
                                            level === 0 ? "w-10 h-10 text-xl" : "w-8 h-8 text-base"
                                        )}>
                                            {node.icon || "📁"}
                                        </div>
                                        <div className="min-w-0 flex flex-col justify-center text-left">
                                             <h4 className={cn(
                                                 "font-bold leading-none tracking-tight whitespace-break-spaces",
                                                 level === 0 ? "text-lg" : "text-base"
                                             )}>
                                                 {node.name}
                                             </h4>
                                             {/* Metadata Stacked */}
                                             <div className="text-xs text-muted-foreground mt-1.5 font-medium flex flex-col gap-1 opacity-80">
                                                <span className="bg-white/20 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] w-fit">
                                                    {node.totalItemCount} items
                                                    {node.children.length > 0 && ` • ${node.children.length} groups`}
                                                </span>
                                                <span className="truncate">Need {formatCurrency(groupRemaining)}</span>
                                             </div>
                                        </div>
                                    </div>

                                    {/* Mobile Amount Display */}
                                    <div className="md:hidden flex flex-col items-end shrink-0">
                                        <span className={cn("font-bold text-base tabular-nums tracking-tight", isOverBudget && "text-red-500 drop-shadow-sm")}>
                                            {formatCurrency(node.totalActual)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground opacity-70">
                                            of {formatCurrency(node.totalEstimated)}
                                        </span>
                                    </div>

                                    {/* Right: Columns (Desktop Only) */}
                                    <div className="hidden md:flex items-center h-full gap-5">
                                         {/* Progress Column */}
                                         {node.totalEstimated > 0 && (
                                            <div className={cn(COL_PROGRESS, "flex flex-col justify-center h-full")}>
                                                <div className="flex justify-between w-full text-[10px] font-medium text-muted-foreground mb-1.5 opacity-80">
                                                    <span>Progress</span>
                                                    <span>{((node.totalActual / node.totalEstimated) * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                                                        style={{ 
                                                            width: `${Math.min((node.totalActual / node.totalEstimated) * 100, 100)}%`,
                                                            backgroundColor: isOverBudget ? '#ef4444' : (node.color || goalColor)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                         )}

                                         {/* Amount Column */}
                                         <div className={cn(COL_AMOUNT, "flex flex-col justify-center text-right shrink-0")}>
                                              <span className={cn("font-bold text-lg tabular-nums tracking-tight", isOverBudget && "text-red-500 drop-shadow-sm")}>
                                                {formatCurrency(node.totalActual)}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground opacity-70">
                                                of {formatCurrency(node.totalEstimated)}
                                              </span>
                                         </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Mobile Progress Bar */}
                                {node.totalEstimated > 0 && (
                                    <div className="md:hidden w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mt-1 opacity-80">
                                        <div 
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{ 
                                                width: `${Math.min((node.totalActual / node.totalEstimated) * 100, 100)}%`,
                                                backgroundColor: isOverBudget ? '#ef4444' : (node.color || goalColor)
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Mobile Actions Row (Below Content) */}
                                {isEditMode && (
                                    <div className="md:hidden flex items-center justify-end gap-2 mt-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                        <EditGroupDialog 
                                            goalId={goal._id} 
                                            group={{ 
                                                _id: node._id, 
                                                name: node.name, 
                                                color: node.color, 
                                                icon: node.icon,
                                                parentGroupId: node.parentGroupId
                                            }} 
                                            existingGroups={goal.groups} 
                                            trigger={
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 bg-white/50 dark:bg-white/5 border-white/20 backdrop-blur-sm">
                                                    <Pencil className="w-3 h-3" />
                                                    Edit
                                                </Button>
                                            }
                                        />
                                        <AddGroupDialog 
                                            goalId={goal._id} 
                                            parentGroupId={node._id}
                                            existingGroups={goal.groups} 
                                            trigger={
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 bg-white/50 dark:bg-white/5 border-white/20 backdrop-blur-sm">
                                                    <Plus className="w-3 h-3" />
                                                    Add Item
                                                </Button>
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </AccordionTrigger>

                        {/* Actions Overlay - Moved OUTSIDE trigger (Desktop Only) */}
                        {node._id !== "unassigned" && isEditMode && (
                            <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 opacity-100 md:opacity-0 md:group-hover/accordion-trigger:opacity-100 transition-all duration-200 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-xl border border-white/20 p-1 shadow-lg z-10 pointer-events-auto scale-90 group-hover/accordion-trigger:scale-100">
                                <EditGroupDialog 
                                    goalId={goal._id} 
                                    group={{ 
                                        _id: node._id, 
                                        name: node.name, 
                                        color: node.color, 
                                        icon: node.icon,
                                        parentGroupId: node.parentGroupId
                                    }} 
                                    existingGroups={goal.groups} 
                                    trigger={
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg hover:bg-white/50 dark:hover:bg-white/10">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                    }
                                />
                                <AddGroupDialog 
                                    goalId={goal._id} 
                                    parentGroupId={node._id}
                                    existingGroups={goal.groups} 
                                    trigger={
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg hover:bg-white/50 dark:hover:bg-white/10">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
                
                <AccordionContent className="pt-0 pb-0">
                    {/* Render Items */}
                    <div className="flex flex-col relative">
                        {/* Optional subtle background for items area */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        
                        {node.items.map((item: any) => {
                            const progress = item.estimatedAmount > 0 ? (item.actualAmount / item.estimatedAmount) * 100 : 0;
                            const isItemOver = item.actualAmount > item.estimatedAmount;
                            const isPaid = progress >= 100;
                            
                            return (
                                <div key={item._id} className="group/item relative flex items-center w-full hover:bg-white/10 dark:hover:bg-white/5 transition-colors border-white/5 pl-0 backdrop-blur-[2px]">
                                     {/* Spacer to align with Header Text Start */}
                                     {level > 0 && (
                                        <div 
                                            className="shrink-0 border-r border-white/10 self-stretch block" 
                                            style={{ width: `${level * 1.5}rem` }} 
                                        />
                                    )}
                                    <div className="w-1.5 shrink-0 self-stretch" style={{ backgroundColor: node.color || goalColor }} />

                                     {/* Main Item Content Container - Matches Header Structure */}
                                    <div className="flex-1 flex flex-col py-3 px-4 min-w-0 gap-1.5 md:gap-0">
                                        {/* Top Row / Desktop Main Row */}
                                        <div className="flex items-center w-full gap-4">
                                            
                                            {/* Left: Icon & Name */}
                                            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                                                {/* Item Icon / Avatar - HIDDEN ON MOBILE */}
                                                <div className={cn(
                                                    "hidden md:flex w-9 h-9 rounded-lg items-center justify-center text-xs font-bold shrink-0 transition-all shadow-sm ml-0.5", 
                                                    isPaid 
                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                                        : "bg-white/40 dark:bg-white/5 text-muted-foreground border border-white/10"
                                                )}>
                                                    {isPaid ? <CheckCircle2 className="w-4 h-4" /> : item.name.charAt(0)}
                                                </div>

                                                <div className="min-w-0 flex flex-col justify-center">
                                                    <span className="font-medium text-sm truncate flex items-center gap-2 text-foreground/90">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 opacity-70">
                                                        Target: <span className="font-medium">{formatCurrency(item.estimatedAmount)}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mobile Amount Display */}
                                            <div className="md:hidden flex flex-col items-end shrink-0">
                                                <div className={cn("font-bold text-sm tabular-nums tracking-tight", isItemOver ? "text-red-500" : "text-emerald-600 dark:text-emerald-400")}>
                                                    {formatCurrency(item.actualAmount)}
                                                </div>
                                                {isItemOver && <span className="text-[9px] text-red-500 font-medium bg-red-500/10 px-1 rounded">Over</span>}
                                            </div>

                                            {/* Right Columns - Desktop Only */}
                                            <div className="hidden md:flex items-center h-full gap-5">
                                                 {/* Progress Column */}
                                                 <div className={cn(COL_PROGRESS, "flex flex-col justify-center")}>
                                                     <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <div 
                                                            className={cn("h-full rounded-full transition-all duration-500 shadow-sm", isItemOver ? "bg-red-500" : "bg-emerald-500")}
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        />
                                                     </div>
                                                     <div className="text-[9px] text-muted-foreground text-right mt-1 font-medium opacity-60">{progress.toFixed(0)}%</div>
                                                 </div>

                                                 {/* Amount Column */}
                                                 <div className={cn(COL_AMOUNT, "text-right shrink-0")}>
                                                     <div className={cn("font-bold text-sm tabular-nums tracking-tight", isItemOver ? "text-red-500" : "text-emerald-600 dark:text-emerald-400")}>
                                                         {formatCurrency(item.actualAmount)}
                                                     </div>
                                                     {isItemOver && <span className="text-[9px] text-red-500 font-medium bg-red-500/10 px-1 rounded">Over</span>}
                                                 </div>
                                            </div>
                                            
                                            {/* Pay Action (Fixed) */}
                                            <div className={cn(COL_ACTIONS, "flex justify-end")}>
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-all scale-90 group-hover/item:scale-100">
                                                     {/* View Mode: Pay Only */}
                                                     {!isEditMode && (
                                                         <PayGoalItemDialog 
                                                            goalName={goal.name}
                                                            item={item}
                                                            wallets={wallets as any[]}
                                                            trigger={
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-emerald-500/20 hover:text-emerald-600 rounded-lg text-muted-foreground">
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </Button>
                                                            }
                                                        />
                                                     )}
                                                     
                                                     {/* Edit Mode Actions */}
                                                     {isEditMode && (
                                                         <>
                                                            <EditGoalItemDialog 
                                                                goalId={goal._id} 
                                                                item={item} 
                                                                existingGroups={goal.groups} 
                                                                trigger={
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-blue-500/20 hover:text-blue-600 rounded-lg text-muted-foreground">
                                                                        <Pencil className="w-3 h-3" />
                                                                    </Button>
                                                                }
                                                            />
                                                            <DeleteGoalItemDialog 
                                                                goalId={goal._id} 
                                                                itemId={item._id} 
                                                                itemName={item.name} 
                                                                trigger={
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-500/20 hover:text-red-600 rounded-lg text-muted-foreground">
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Row: Mobile Progress Bar */}
                                        <div className="md:hidden w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mt-0.5 opacity-60">
                                            <div 
                                                className={cn("h-full rounded-full transition-all", isItemOver ? "bg-red-500" : "bg-emerald-500")}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Render Subgroups */}
                    {node.children.length > 0 && (
                        <div className="pb-3">
                             <Accordion type="multiple" className="space-y-4 pt-3">
                                {node.children.map(child => (
                                    <GroupRenderer key={child._id} node={child} level={level + 1} />
                                ))}
                             </Accordion>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        );
    };

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
            {/* GLASS + ICON BACKGROUND DESIGN - SAME AS BEFORE */}
            <div className="px-4">
                <div 
                    className="relative overflow-hidden rounded-[32px] shadow-xl transition-all duration-500 group bg-card"
                >
                    {/* Background Layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/5" />
                    <div 
                        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15]" 
                        style={{ backgroundColor: goalColor }} 
                    />
                    <div className="absolute md:-bottom-10 -right-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                        <span className="text-[250px] leading-none grayscale" style={{ color: goalColor }}>
                            {goal.icon || "🎯"}
                        </span>
                    </div>

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

                            {/* Stats */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-end">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div className="flex gap-2">
                                <Button 
                                    size="icon" 
                                    variant={isEditMode ? "secondary" : "ghost"}
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className="h-9 w-9"
                                    title={isEditMode ? "Done Editing" : "Manage Goals"}
                                >
                                    {isEditMode ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Pencil className="w-4 h-4" />}
                                </Button>
                                {isEditMode && (
                                    <>
                                        <AddGroupDialog goalId={goal._id} existingGroups={goal.groups} />
                                        <AddGoalItemDialog goalId={goal._id} existingGroups={goal.groups} />
                                    </>
                                )}
                            </div>
                        </div>

                        <Accordion type="multiple" defaultValue={rootNodes.map(n => n._id)} className="space-y-4">
                            {rootNodes.map((node) => (
                                <GroupRenderer key={node._id} node={node} />
                            ))}
                        </Accordion>
                        
                        {rootNodes.length === 0 && (
                            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
                                <p className="text-muted-foreground">No groups found</p>
                                <Button variant="link" onClick={() => (document.querySelector('[data-dialog-trigger="add-group"]') as HTMLElement)?.click()}>Create a Group</Button>
                            </div>
                        )}
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
                        </div>
                        
                        <div className="overflow-hidden">
                             <GoalHistoryList 
                                history={filteredHistory || []} 
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                itemColorMap={goal.items.reduce((acc: any, item: any) => {
                                    // Use first char or random color if not grouped? 
                                    // Or try to find group color.
                                    acc[item._id] = goal.color || "#6366f1"; 
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
