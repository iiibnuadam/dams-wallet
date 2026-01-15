

"use client";

import { useState, useMemo, useCallback } from "react";
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
    const { data: goal, isLoading: isGoalLoading, error, refetch } = useGoal(goalId);
    const { data: wallets = [] } = useWallets("ALL");

    // Debugging render
    // console.log("GoalDetailView Render:", { goalId, goalType: typeof goal, isGoalLoading });

    // Memoize refresh to prevent unnecessary re-renders or loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleRefresh = useCallback(() => {
        console.log("handleRefresh called");
        refetch();
    }, []);

    const [activeTab, setActiveTab] = useState("overview");
    const [historyFilter, setHistoryFilter] = useState<{ type: 'ALL' | 'GROUP' | 'ITEM', id?: string, name?: string }>({ type: 'ALL' });
    const [isEditMode, setIsEditMode] = useState(false);

    // Build the Tree
    const rootNodes = useMemo(() => {
        if (!goal || typeof goal !== 'object') return [];

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
             // Recursively find all group IDs under this group
             const getGroupIds = (rootId: string): string[] => {
                const directChildren = (goal.groups || []).filter((g: any) => g.parentGroupId === rootId);
                return [rootId, ...directChildren.flatMap((c: any) => getGroupIds(c._id))];
             };
             
             const targetGroupIds = new Set(getGroupIds(historyFilter.id!));
             const allowedItemIds = new Set(
                 (goal.items || [])
                 .filter((i: any) => i.groupId && targetGroupIds.has(i.groupId))
                 .map((i: any) => i._id)
             );

             return allowedItemIds.has(txnItemId);
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
    
    // Remaining is: sum of (item.estimated - item.actual) for incomplete items only?
    // OR: Total Est - Total Act?
    // If I have item A: Est 100, Act 80, Done. Remaining 0.
    // If simple subtraction: 100 - 80 = 20 remaining.
    // So we must calculate remaining per item!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalRemaining = goal.items.reduce((sum: number, item: any) => {
        if (item.isCompleted) return sum; // 0 remaining for this item
        return sum + Math.max(0, item.estimatedAmount - item.actualAmount);
    }, 0);

    // Progress = (Total Est - Total Remaining) / Total Est ?
    // If I saved money (Est 100, Act 80, Done), I achieved the goal of 100 value? 
    // Usually "Progress" means how much of the bill is paid.
    // If I negotiated 100 -> 80, I effectively paid 100% of the obligation.
    // So progress should be based on "Virtual Actual"? 
    // Let's stick to (totalActual / totalEstimated) but cap at 100? 
    // NO, if I saved 20, my totalActual is 80. 
    // If I display 80/100, it looks 80%.
    // But if "Done", user expects 100%.
    // Let's use: (Total Est - Total Remaining) / Total Est
    // If Remaining is 0, Progress is 100%. Correct.
    const overallProgress = totalEstimated > 0 ? ((totalEstimated - totalRemaining) / totalEstimated) * 100 : 0;

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
        // Recalculate remaining for this node specially using the item.isCompleted flag logic
        // We can't just use node.totalEstimated - node.totalActual because totalActual is raw sum.
        // We need to traverse children/items again or pre-calculate differently?
        // Since we already have the node structure with items, let's re-sum properly.
        const calculateNodeRemaining = (n: GroupNode): number => {
            let rem = n.items.reduce((acc, i) => {
                if (i.isCompleted) return acc;
                return acc + Math.max(0, i.estimatedAmount - i.actualAmount);
            }, 0);
            n.children.forEach(c => rem += calculateNodeRemaining(c));
            return rem;
        };
        const groupRemaining = calculateNodeRemaining(node);
        
        const isOverBudget = node.totalActual > node.totalEstimated;
        
        // Shared Column Widths
        const COL_PROGRESS = "w-[150px]";
        const COL_AMOUNT = "w-auto md:w-[130px]"; // Responsive width
        const COL_ACTIONS = "w-auto md:w-[40px]"; // For hover buttons

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
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                                <span className="bg-white/20 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] w-fit">
                                                    {node.totalItemCount} items
                                                </span>
                                                <span className="bg-white/20 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] w-fit">
                                                    {node.children.length > 0 && ` • ${node.children.length} groups`}
                                                </span>
                                              </div>
                                                {/* Group Status Logic */}
                                                {(() => {
                                                    let statusLabel = "";
                                                    let statusClass = "";
                                                    
                                                    // Check if all items in this group (recursive?) are completed? 
                                                    // Or simplier: Check amounts first.
                                                    if (node.totalActual > node.totalEstimated) {
                                                        statusLabel = "Melebihi Target"; 
                                                        statusClass = "text-amber-600 dark:text-amber-400 font-medium";
                                                    } else if (node.totalActual === node.totalEstimated && node.totalEstimated > 0) {
                                                        statusLabel = "Tercapai";
                                                        statusClass = "text-blue-600 dark:text-blue-400 font-medium";
                                                    } else if (groupRemaining <= 0 && node.totalEstimated > 0) {
                                                         // Could happen if slight overage or exact
                                                         statusLabel = "Lunas"; // If items manually marked? Group doesn't have manual mark.
                                                         // Let's stick to amounts unless we traverse children.
                                                         statusLabel = "Tercapai";
                                                         statusClass = "text-blue-600 dark:text-blue-400 font-medium";
                                                    } else {
                                                        statusLabel = `Need ${formatCurrency(groupRemaining)}`;
                                                        statusClass = "text-red-500";
                                                    }

                                                    if (node.totalEstimated === 0) return null; // Don't show if no estimate

                                                    return (
                                                        <span className={cn("truncate font-medium flex items-center gap-1.5", statusClass)}>
                                                            {statusLabel}
                                                        </span>
                                                    );
                                                })()}
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
                                                    <span>{((node.totalEstimated - groupRemaining)/ node.totalEstimated * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                                                        style={{ 
                                                            width: `${Math.min(((node.totalEstimated - groupRemaining) / node.totalEstimated) * 100, 100)}%`,
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

                                
                                </div>
                            </AccordionTrigger>

                            {/* Mobile Actions Row (Rendered OUTSIDE Trigger to avoid nested buttons) */}
                            {isEditMode && (
                                <div className={cn(
                                    "md:hidden flex items-center justify-end gap-2 px-4 pb-4 w-full relative z-10",
                                    // Match background of header but only bottom part? 
                                    // Or rely on parent container background? Parent row (line 267) has no bg.
                                    // We should add background to this div to look seamless.
                                    level === 0 
                                        ? "bg-white/10 dark:bg-white/5" 
                                        : "bg-white/5 dark:bg-white/[0.02]"
                                )}>
                                    <div className="flex items-center gap-2 w-full justify-end border-t border-white/5 pt-3">
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
                                </div>
                            )}

                        {/* Actions Overlay - Moved OUTSIDE trigger (Desktop Only) */}
                        {node._id !== "unassigned" && (
                            <div className={cn(
                                "hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 transition-all duration-200 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-xl border border-white/20 p-1 shadow-lg z-10 pointer-events-auto",
                                isEditMode ? "opacity-100 scale-100" : "opacity-0 group-hover/accordion-trigger:opacity-100 scale-90 group-hover/accordion-trigger:scale-100"
                            )}>
                                {!isEditMode ? (
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-muted-foreground hover:text-orange-600 rounded-lg hover:bg-white/50 dark:hover:bg-white/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFilter('GROUP', node._id, node.name);
                                        }}
                                        title="View Group History"
                                    >
                                        <History className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <>
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
                                    </>
                                )}
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
                            // If marked as completed, force progress to 100% (or should we show actual?)
                            // User wants it to look "Lunas".
                            // Let's say: if completed, Remaining is 0.
                            const progress = item.isCompleted 
                                ? 100 
                                : item.estimatedAmount > 0 
                                    ? (item.actualAmount / item.estimatedAmount) * 100 
                                    : 0;
                            
                            const isItemOver = item.actualAmount > item.estimatedAmount;
                            const isPaid = item.isCompleted || progress >= 100;
                            
                            // If completed but under budget, maybe show green with a check?
                            const isUnderBudget = item.isCompleted && item.actualAmount < item.estimatedAmount;

                            // Status Logic
                            const remaining = Math.max(0, item.estimatedAmount - item.actualAmount);
                            let statusLabel = "";
                            let statusClass = "";

                            if (item.isCompleted) {
                                statusLabel = "Lunas";
                                statusClass = "text-emerald-600 dark:text-emerald-400 font-bold";
                            } else if (item.actualAmount > item.estimatedAmount) {
                                statusLabel = "Melebihi Target"; // Exceeded
                                statusClass = "text-amber-600 dark:text-amber-400 font-medium";
                            } else if (item.actualAmount === item.estimatedAmount && item.estimatedAmount > 0) {
                                statusLabel = "Tercapai"; // Reached
                                statusClass = "text-blue-600 dark:text-blue-400 font-medium";
                            } else {
                                statusLabel = `Need ${formatCurrency(remaining)}`;
                                statusClass = "text-red-500 font-medium";
                            }

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
                                        <div className="flex flex-col md:flex-row w-full md:items-center gap-2 md:gap-4">
                                            {/* Mobile Wrapper for Name and Amount */}
                                            <div className="flex items-center w-full md:w-auto md:contents gap-4 justify-between">
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
                                                        <span className="font-medium text-sm truncate flex items-center gap-2 text-foreground/90 whitespace-break-spaces">
                                                            {item.name}
                                                        </span>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2 text-[10px] mt-0.5 w-fit">
                                                            <span className="text-muted-foreground opacity-70">
                                                                Target: <span className="font-medium">{formatCurrency(item.estimatedAmount)}</span>
                                                            </span>
                                                            <span className={cn("px-1.5 py-0.5 rounded w-fit bg-black/5 dark:bg-white/5", statusClass)}>
                                                                {statusLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mobile Amount Display */}
                                                <div className="md:hidden flex flex-col items-end shrink-0">
                                                    <div className={cn("font-bold text-sm tabular-nums tracking-tight", isItemOver ? "text-red-500" : "text-emerald-600 dark:text-emerald-400")}>
                                                        {formatCurrency(item.actualAmount)}
                                                    </div>
                                                    {isItemOver && <span className="text-[9px] text-red-500 font-medium bg-red-500/10 px-1 rounded">Over</span>}
                                                </div>
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
                                            
                                            {/* Pay Action (Responsive) */}
                                            <div className={cn(COL_ACTIONS, "flex w-full md:w-auto justify-end mt-1 md:mt-0")}>
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-all scale-100 md:scale-90 md:group-hover/item:scale-100">
                                                     {/* View Mode: Pay Only */}
                                                     {!isEditMode && (
                                                         <>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7 hover:bg-orange-500/20 hover:text-orange-600 rounded-lg text-muted-foreground mr-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleFilter('ITEM', item._id, item.name);
                                                                }}
                                                                title="View History"
                                                            >
                                                                <History className="w-3.5 h-3.5" />
                                                            </Button>
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
                                                         </>
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
                                            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-sm whitespace-break-spaces">
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

                         {/* Total Summary */}
                         {(filteredHistory?.length || 0) > 0 && (
                            <div className="bg-muted/30 border rounded-2xl p-4 flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-1">
                                        Total {historyFilter.type === 'ALL' ? 'History' : historyFilter.name}
                                    </p>
                                    <h4 className="text-2xl font-bold tracking-tight tabular-nums">
                                        {formatCurrency((filteredHistory || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0))}
                                    </h4>
                                </div>
                                <div className="text-right">
                                     <p className="text-xs text-muted-foreground">
                                        {(filteredHistory || []).length} transactions
                                     </p>
                                </div>
                            </div>
                         )}
                        
                        <div className="overflow-hidden">
                            <GoalHistoryList 
                                history={filteredHistory || []} 
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                itemColorMap={(goal?.items || []).reduce((acc: any, item: any) => {
                                    // Find group for this item
                                    // Groups is goal.groups array. items have groupId.
                                    const group = (goal?.groups || []).find((g: any) => g._id === item.groupId);
                                    acc[item._id] = group?.color || goal?.color || "#6366f1"; 
                                    return acc;
                                }, {})}
                                onRefresh={handleRefresh}
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
