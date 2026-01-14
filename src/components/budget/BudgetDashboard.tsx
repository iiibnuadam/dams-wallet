"use client";

import { useEffect, useState, useRef } from "react";
import { format, differenceInCalendarDays, endOfMonth, startOfMonth } from "date-fns";
import { getBudgetOverviewAction, upsertBudgetAction, getCategoriesForBudgetAction, generateBudgetFromCategoriesAction } from "@/actions/budget-actions";


import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MoneyInput } from "@/components/ui/money-input";
import { 
  Plus, Trash2, Edit2, Save, X, 
  TrendingDown,
  Wallet, Calendar, Target,
  Sparkles, AlertCircle, ArrowUpRight, Check,
  PiggyBank, Heart, Shield, Calculator
} from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";

// Types
interface Category {
  _id: string;
  name: string;
}

interface BudgetItem {
    _id?: string;
    name: string;
    limit: number;
    trackingType: "DAILY" | "WEEKLY" | "MONTHLY";
    categories: string[];
    spent?: number;
    safeToSpendDaily?: number;
}

interface BudgetGroup {
  _id?: string;
  name: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
  
  items: BudgetItem[];
  limit?: number;
  trackingType?: "DAILY" | "WEEKLY" | "MONTHLY";
  categories?: string[];

  // Computed
  isLeaf?: boolean;
  totalSpent?: number;
  totalLimit?: number;
  safeToSpendDaily?: number;
}

const PRESET_EMOJIS = [
  "🍔", "🚗", "🏠", "🛍️", "✈️", 
  "🏥", "🎓", "🎮", "💡", "📦", 
  "💅", "🏋️", "🎁", "📱", "💸"
];

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", 
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"
];

import { useSearchParams } from "next/navigation";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { BatchAllocationDialog } from "@/components/budget/BatchAllocationDialog";

// ... existing imports

export default function BudgetDashboard() {
  const [currentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");
  
  // Edit State
  const [editedGroups, setEditedGroups] = useState<BudgetGroup[]>([]);
  const [editedIncome, setEditedIncome] = useState<number>(0);
  
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const [data, items] = await Promise.all([
          getBudgetOverviewAction(currentMonth, currentView || undefined),
          getCategoriesForBudgetAction()
      ]);
      setOverview(data);
      setAllCategories(items);
      
      setEditedIncome(data.income || 0);
      setEditedGroups(data.groups?.map((g: any) => ({
        ...g,
        categories: g.categories || [],
        items: (g.items || []).map((i: any) => ({...i, categories: i.categories || []}))
      })) || []);
    } catch (error) {
        console.error(error);
      toast.error("Failed to load budget");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentView]);

  const canEdit = !currentView || currentView === "ADAM"; // Assuming ADAM is default/me. Ideally check session or allow only if ALL is false.
  // Actually, for now, restrict editing if view is defined and not "ADAM" (assuming current user is ADAM for this dev). 
  // Better: Disable if view === "ALL". 
  const isReadOnly = currentView === "ALL" || (currentView && currentView !== "ADAM"); // Hardcoded for prototype safety
  const handleSave = async () => {
    try {
      await upsertBudgetAction(currentMonth, editedGroups, editedIncome);
      toast.success("Budget updated");
      setIsEditing(false);
      fetchBudget(); 
    } catch (error) {
      toast.error("Failed to save budget");
    }
  };



  if (loading) return <BudgetSkeleton />;

  // Overview Calcs
  const totalIncome = overview?.realizedIncome || 0; // Use Actual Income as requested
  const projectedIncome = overview?.income || 0; // Keep track of manual plan
  
  const totalBudget = overview?.totalBudget || 0;
  const totalSpent = overview?.totalSpent || 0;
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  
  const projectedSavings = Math.max(0, totalIncome - totalBudget);
  const savingsPercent = totalIncome > 0 ? (projectedSavings / totalIncome) * 100 : 0;

  const isOverBudget = totalSpent > totalBudget;
  const today = new Date();
  const lastDay = endOfMonth(today);
  const daysLeft = Math.max(1, differenceInCalendarDays(lastDay, today));
  const dailySafeSpend = totalRemaining > 0 ? totalRemaining / daysLeft : 0;

  // Split Groups
  const needsGroups = (overview?.groups || []).filter((g: any) => g.type === "NEEDS");
  const wantsGroups = (overview?.groups || []).filter((g: any) => g.type === "WANTS");

  // Construct global filter link
  const startDate = format(startOfMonth(new Date(currentMonth)), "yyyy-MM-dd");
  const endDate = format(endOfMonth(new Date(currentMonth)), "yyyy-MM-dd");
  const globalTxLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE${currentView ? `&view=${currentView}` : ''}`;

  return (
    <div className="min-h-screen pb-20 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                Monthly Budget
                {isOverBudget && <Badge variant="destructive" className="ml-2 animate-pulse">Over Budget</Badge>}
            </h1>
            <div className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(currentMonth), "MMMM yyyy")}
                <span className="mx-2 text-muted-foreground/30">|</span>
                <ViewToggle defaultView="ADAM" />
            </div>
         </div>
         <div className="flex gap-2">
             {isEditing ? (
                 <>
                   <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                   <Button onClick={handleSave} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Save className="mr-2 h-4 w-4" /> Save</Button>
                 </>
             ) : (
                <>
                 <Link href={globalTxLink}>
                    <Button variant="outline"><ArrowUpRight className="w-4 h-4 mr-2" /> View Transactions</Button>
                 </Link>
                 {!isReadOnly && (
                     <Button variant="outline" className="border-dashed" onClick={() => setIsEditing(true)}>
                         <Edit2 className="w-4 h-4 mr-2" /> Adjust Budget
                     </Button>
                 )}
                 </>
             )}
         </div>
      </div>

      {/* Insight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* INCOME - EXPENSES = SAVINGS Card */}
          <Card className="md:col-span-2 relative overflow-hidden text-white border-0 shadow-xl shadow-indigo-500/20 bg-gradient-to-br from-indigo-600 to-violet-700">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                  <PiggyBank className="w-48 h-48" />
              </div>
              <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                  <div className="grid grid-cols-2 gap-8">
                      <div>
                          <p className="text-indigo-200 font-medium text-xs uppercase tracking-wider mb-1">Projected Savings</p>
                          <h2 className="text-3xl md:text-4xl font-black tracking-tight flex items-baseline gap-2">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(projectedSavings)}
                            <span className="text-lg font-medium text-indigo-300 opacity-80">({savingsPercent.toFixed(0)}%)</span>
                          </h2>
                      </div>
                      <div className="text-right">
                          <p className="text-indigo-200 font-medium text-xs uppercase tracking-wider mb-1">Actual Income</p>
                          <h2 className="text-2xl font-bold">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalIncome)}
                          </h2>
                          {projectedIncome > 0 && projectedIncome !== totalIncome && (
                              <p className="text-[10px] text-indigo-300 mt-1">Plan: {new Intl.NumberFormat("id-ID", { notation: "compact" }).format(projectedIncome)}</p>
                          )}
                      </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-indigo-100">
                          <Wallet className="w-4 h-4" />
                          <span>Total Budget: {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(totalBudget)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-indigo-100">
                           <TrendingDown className="w-4 h-4" />
                           <span>Spent: {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(totalSpent)}</span>
                      </div>
                  </div>
              </CardContent>
          </Card>
          
          <Card className="bg-card border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                         <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600"><Sparkles className="w-5 h-5" /></div>
                            <span className="font-bold text-muted-foreground text-sm uppercase">Daily Safe Spend</span>
                         </div>
                         <p className="text-3xl font-bold text-foreground mt-2">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(dailySafeSpend)}
                         </p>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-muted-foreground">For next <b>{daysLeft} days</b>.</p>
                    </div>
                </CardContent>
          </Card>
      </div>

      <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
        {isEditing ? (
            <EditBudgetView 
                groups={editedGroups} 
                setGroups={setEditedGroups} 
                income={editedIncome}
                setIncome={setEditedIncome}
                categories={allCategories} 
            />
        ) : (
            <>
                {/* Empty State */}
                {(overview?.groups || []).length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-muted/10">
                        <p className="text-muted-foreground mb-4">No Budget Groups found for this month.</p>
                        <div className="flex gap-4 justify-center">
                            <Button variant="outline" onClick={() => setIsEditing(true)}>Manual Setup</Button>
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-4 max-w-sm mx-auto">
                            Automatically creates groups like "Food", "Transport" split by Needs/Wants based on your existing categories.
                        </p>
                    </div>
                )}
                
                {needsGroups.length > 0 && (
                    <div className="space-y-4">
                         <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                             <Shield className="w-5 h-5" /> Needs
                             <Badge variant="secondary" className="ml-2 font-mono">
                                {new Intl.NumberFormat("id-ID", { notation: "compact" }).format(needsGroups.reduce((acc: number, g: any) => acc + (g.totalLimit || 0), 0))}
                             </Badge>
                         </h3>
                         <Accordion type="multiple" className="space-y-4" defaultValue={needsGroups.map((g: any) => g._id)}>
                            {needsGroups.map((group: any) => (
                                <BudgetGroupAccordion key={group._id} group={group} categories={allCategories} period={currentMonth} />
                            ))}
                         </Accordion>
                    </div>
                )}

                {wantsGroups.length > 0 && (
                    <div className="space-y-4">
                         <h3 className="text-lg font-bold flex items-center gap-2 text-purple-600">
                             <Heart className="w-5 h-5" /> Wants
                             <Badge variant="secondary" className="ml-2 font-mono">
                                {new Intl.NumberFormat("id-ID", { notation: "compact" }).format(wantsGroups.reduce((acc: number, g: any) => acc + (g.totalLimit || 0), 0))}
                             </Badge>
                         </h3>
                         <Accordion type="multiple" className="space-y-4" defaultValue={wantsGroups.map((g: any) => g._id)}>
                            {wantsGroups.map((group: any) => (
                                <BudgetGroupAccordion key={group._id} group={group} categories={allCategories} period={currentMonth} />
                            ))}
                         </Accordion>
                    </div>
                )}
            </>
        )}
       </div>

    </div>
  );
}

// ------------------- COMPONENTS -------------------

function CompactCategorySelect({ selected, onSelect, categories, usedCategories = [] }: { selected: string[], onSelect: (newCats: string[]) => void, categories: Category[], usedCategories?: string[] }) {
    const [open, setOpen] = useState(false);
    
    // Sort selected to top
    // Filter out usedCategories that are NOT in current 'selected' (so we don't hide what we already have selected)
    const availableCats = categories.filter(c => !usedCategories.includes(c._id) || selected.includes(c._id));

    const sortedCats = [...availableCats].sort((a, b) => {
        const aSel = selected.includes(a._id);
        const bSel = selected.includes(b._id);
        if (aSel && !bSel) return -1;
        if (!aSel && bSel) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-9 text-xs border-dashed font-normal text-muted-foreground">
                        {selected.length > 0 ? (
                            <div className="flex gap-1 overflow-hidden">
                                {selected.slice(0, 2).map(id => {
                                    const c = categories.find(cat => cat._id === id);
                                    return <span key={id} className="bg-primary/10 text-primary px-1 rounded-sm whitespace-nowrap">{c?.name}</span>
                                })}
                                {selected.length > 2 && <span className="bg-muted px-1 rounded-sm">+{selected.length - 2}</span>}
                            </div>
                        ) : (
                            "+ Categories"
                        )}
                        <span className="opacity-50">▼</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search category..." className="h-9" />
                        <CommandList>
                            <CommandEmpty>No available category found.</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-y-auto">
                                {sortedCats.map((cat) => (
                                    <CommandItem
                                        key={cat._id}
                                        value={cat.name}
                                        onSelect={() => {
                                            const newSel = selected.includes(cat._id) 
                                                ? selected.filter(id => id !== cat._id)
                                                : [...selected, cat._id];
                                            onSelect(newSel);
                                        }}
                                        className="text-xs"
                                    >
                                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", selected.includes(cat._id) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        <span>{cat.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}


function BudgetGroupAccordion({ group, categories, period }: { group: BudgetGroup, categories: Category[], period: string }) {
    const groupPercent = Math.min(100, ((group.totalSpent || 0) / (group.totalLimit || 1)) * 100);
    const isOver = (group.totalSpent || 0) > (group.totalLimit || 0);

    // Get all category IDs involved in this group
    let involvedCategories: string[] = [];
    
    // Priority 1: Target Group (Dynamic Linking)
    if (group.targetGroup) {
        involvedCategories = categories.filter(c => c.group === group.targetGroup).map(c => c._id);
    } 
    // Priority 2: Leaf Node with specific categories
    else if ((!group.items || group.items.length === 0) && group.categories) { 
        involvedCategories = group.categories;
    } 
    // Priority 3: Complex Group Items
    else if (group.items) {
        involvedCategories = group.items.flatMap(i => i.categories);
    }
    
    // De-duplicate
    involvedCategories = Array.from(new Set(involvedCategories));

    // Link
    const startDate = format(startOfMonth(new Date(period)), "yyyy-MM-dd");
    const endDate = format(endOfMonth(new Date(period)), "yyyy-MM-dd");
    const groupLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE&categoryId=${involvedCategories.join(',')}`;

    return (
        <AccordionItem value={group._id || group.name} className="border rounded-2xl px-1 overflow-visible bg-white dark:bg-card hover:bg-muted/30 transition-all border-l-[6px] shadow-sm group" style={{ borderLeftColor: group.color }}>
            <AccordionTrigger className="hover:no-underline py-5 px-5 pl-5">
                 <div className="flex-1 text-left mr-4">
                      <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm text-2xl border" style={{ borderColor: group.color + '40', backgroundColor: group.color + '10' }}>
                                   {group.icon || "📁"}
                               </div>
                               <div>
                                   <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-xl leading-tight text-foreground">{group.name}</h4>
                                        {group.isLeaf && <Badge variant="outline" className="text-[10px] h-5 bg-background">Simple</Badge>}
                                   </div>
                               </div>
                          </div>
                          <div className="text-right">
                               <div className={cn("text-xl font-black", isOver ? "text-red-500" : "text-foreground")}>
                                   {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(group.totalSpent || 0)}
                               </div>
                               <div className="text-xs font-medium text-muted-foreground">
                                   of {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(group.totalLimit || 0)}
                               </div>
                          </div>
                      </div>
                      
                      <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden">
                          <div 
                              className="h-full rounded-full transition-all duration-700 ease-out relative"
                              style={{ width: `${groupPercent}%`, backgroundColor: isOver ? '#ef4444' : group.color }}
                          >
                               {groupPercent > 0 && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                          </div>
                      </div>
                 </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-0 space-y-3">
                 {/* Only show items list if parent */}
                 {!group.isLeaf && group.items?.length > 0 ? (
                     group.items.map((item, idx) => {
                         const itemPercent = Math.min(100, ((item.spent || 0) / (item.limit || 1)) * 100);
                         const itemOver = (item.spent || 0) > item.limit;
                         
                         // Local link for item
                         const itemCats = item.categories.join(',');
                         const itemLink = `/transactions?mode=RANGE&startDate=${startDate}&endDate=${endDate}&type=EXPENSE&categoryId=${itemCats}`;

                         return (
                             <Link href={itemLink} key={idx} className="block group/link">
                             <div className="bg-background/80 backdrop-blur-sm border rounded-xl p-4 space-y-4 shadow-sm hover:shadow-md transition-all group/item relative hover:border-primary/30">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold flex items-center gap-2 text-base">
                                                {item.name}
                                                {itemOver && <AlertCircle className="w-4 h-4 text-red-500" />}
                                                <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-medium">
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-muted text-muted-foreground">{item.trackingType}</Badge>
                                                <span>Target: {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(item.limit)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn("font-bold text-lg", itemOver ? "text-red-600" : "text-emerald-600")}>
                                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.spent || 0)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="h-2.5 flex-1 bg-muted rounded-full overflow-hidden">
                                             <div className={cn("h-full rounded-full transition-all duration-500", itemOver ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${itemPercent}%` }} />
                                        </div>
                                        <div className="text-xs font-bold w-10 text-right text-muted-foreground">{itemPercent.toFixed(0)}%</div>
                                    </div>
                             </div>
                             </Link>
                         );
                     })
                 ) : (
                    // Leaf Node Content
                     <div className="flex flex-col gap-4 bg-muted/10 p-4 rounded-xl border border-dashed">
                        <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Traacked Categories</span>
                            <div className="flex flex-wrap gap-1">
                                {involvedCategories.length > 0 ? (
                                    involvedCategories.map(catId => {
                                        const cat = categories.find(c => c._id === catId);
                                        return (
                                            <Badge key={catId} variant="secondary" className="text-[10px] h-5 bg-background border shadow-sm font-normal">
                                                {cat?.name || "Unknown"}
                                            </Badge>
                                        )
                                    })
                                ) : (
                                    <span className="text-sm text-muted-foreground italic">No categories assigned.</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link href={groupLink}>
                                <Button size="sm" variant="outline"><ArrowUpRight className="w-3 h-3 mr-1" /> View Transactions</Button>
                            </Link>
                        </div>
                     </div>
                 )}
            </AccordionContent>
        </AccordionItem>
    )
}

// Types
interface Category {
  _id: string;
  name: string;
  group?: string;
  bucket?: "NEEDS" | "WANTS" | "SAVINGS";
}

interface BudgetItem {
    _id?: string;
    name: string;
    limit: number;
    trackingType: "DAILY" | "WEEKLY" | "MONTHLY";
    categories: string[];
    spent?: number;
    safeToSpendDaily?: number;
}

interface BudgetGroup {
  _id?: string;
  name: string;
  type: "NEEDS" | "WANTS" | "SAVINGS";
  icon: string;
  color: string;
  
  items: BudgetItem[];
  limit?: number;
  trackingType?: "DAILY" | "WEEKLY" | "MONTHLY";
  targetGroup?: string; // NEW
  categories?: string[];

  // Computed
  isLeaf?: boolean;
  totalSpent?: number;
  totalLimit?: number;
  safeToSpendDaily?: number;
}
// ... existing constants ...

// ... inside EditBudgetView ...
function EditBudgetView({ groups, setGroups, income, setIncome, categories }: { groups: BudgetGroup[], setGroups: (g: BudgetGroup[]) => void, income: number, setIncome: (n: number) => void, categories: Category[] }) {
    
    // Derive available groups from categories
    const availableGroups = Array.from(new Set(categories.map(c => c.group).filter(Boolean))) as string[];

    // Calculate Total Budget from Groups
    const totalBudget = groups.reduce((acc, g) => {
        if (g.items && g.items.length > 0) return acc + g.items.reduce((a, i) => a + (i.limit || 0), 0);
        return acc + (g.limit || 0);
    }, 0);
    const projectedSavings = Math.max(0, income - totalBudget);

    // Calculate USED Categories to filter unique
    const getUsedCategories = (currentGroupId?: number, currentItemId?: number) => {
        // Collect all categories used anywhere expected in the current scope
        const used = new Set<string>();
        groups.forEach((g, gIdx) => {
            // Leaf groups
            if ((!g.items || g.items.length === 0) && g.categories) {
                if (gIdx !== currentGroupId) {
                    g.categories.forEach(c => used.add(c));
                }
            }
            // Complex groups
            if (g.items) {
                g.items.forEach((i, iIdx) => {
                     if (gIdx !== currentGroupId || iIdx !== currentItemId) {
                         i.categories.forEach(c => used.add(c));
                     }
                });
            }
        });
        return Array.from(used);
    };

    // Smart Allocation State
    const [batchAllocateOpen, setBatchAllocateOpen] = useState(false); // NEW

    const handleSmartSave = (newGroups: BudgetGroup[]) => {
        // Replace existing groups completely to avoid duplicates ("General Living", etc.)
        // Since the Wizard is "Global", it accounts for all categories, so a full replace is appropriate.
        setGroups(newGroups);
        setBatchAllocateOpen(false); 
    };

    // Group Actions
    const updateGroup = (idx: number, field: keyof BudgetGroup, val: any) => {
        const newG = [...groups];
        // If switching to targetGroup, clear categories to avoid confusion? Or keep them?
        // Let's clear specific categories if targetGroup is set significantly? 
        // Actually, let logic exist: prioritize targetGroup if present.
        
        if (field === 'targetGroup' && val) {
             // If setting targetGroup, clear manual categories to be clean
             // newG[idx].categories = [];
        }

        newG[idx] = { ...newG[idx], [field]: val };
        setGroups(newG);
    };
    const addGroup = () => {
        setGroups([...groups, {
            name: "New Group", icon: "🍔", color: "#3b82f6", items: [], type: "NEEDS",
            // Default Leaf Values
            trackingType: "MONTHLY", limit: 0, categories: [], targetGroup: ""
        }]);
    };
    const removeGroup = (idx: number) => { setGroups(groups.filter((_, i) => i !== idx)); };
    const toggleGroupCat = (gIdx: number, newCats: string[]) => {
        // If selecting categories, we should probably clear targetGroup?
        // Let's allow hybrid but UI should show switch.
        // For simplicity: If user interacts with cat select, clear targetGroup.
        const newG = [...groups];
        newG[gIdx].categories = newCats;
        newG[gIdx].targetGroup = ""; // Reset target group to enforce "Use Specific Categories" mode
        setGroups(newG);
    };
     const setGroupTarget = (gIdx: number, groupName: string) => {
        const newG = [...groups];
        newG[gIdx].targetGroup = groupName;
        newG[gIdx].categories = []; // Clear specific cats
        // Also auto-update group name if generic? Nah, keep custom name.
        if (newG[gIdx].name === "New Group") newG[gIdx].name = groupName;
        setGroups(newG);
    };

    // Item Actions
    const addItem = (gIdx: number) => {
        const newG = [...groups];
        // Clear leaf properties when promoting to parent
        newG[gIdx].categories = []; 
        newG[gIdx].limit = 0;
        
        newG[gIdx].items.push({ name: "New Item", limit: 500000, trackingType: "MONTHLY", categories: [] });
        setGroups(newG);
    };
    const updateItem = (gIdx: number, iIdx: number, field: keyof BudgetItem, val: any) => {
         const newG = [...groups];
         newG[gIdx].items[iIdx] = { ...newG[gIdx].items[iIdx], [field]: val };
         setGroups(newG);
    };
    const removeItem = (gIdx: number, iIdx: number) => {
         const newG = [...groups];
         newG[gIdx].items = newG[gIdx].items.filter((_, i) => i !== iIdx);
         setGroups(newG);
    };
    const toggleItemCat = (gIdx: number, iIdx: number, newCats: string[]) => {
         updateItem(gIdx, iIdx, 'categories', newCats);
    };

    return (
        <div className="space-y-6">
            <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                         <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-bold">Budget Planning</span>
                         </div>
                        <div className="flex gap-2 items-center">
                             <Button onClick={() => setBatchAllocateOpen(true)} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-indigo-50/50">
                                <Sparkles className="w-4 h-4 mr-2" /> Quick Plan (Wizard)
                             </Button>
                             <div className="flex-1 min-w-[200px] p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-dashed flex justify-between items-center">
                                  <div className="text-sm font-medium text-muted-foreground mr-4">Est. Savings</div>
                                  <div className="text-xl font-bold text-indigo-600">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(projectedSavings)}</div>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <BatchAllocationDialog 
                open={batchAllocateOpen}
                onOpenChange={setBatchAllocateOpen}
                categories={categories}
                existingGroups={groups}
                onSave={handleSmartSave}
                income={income}
            />



            {groups.map((group, gIdx) => {
                const isLeaf = (group.items || []).length === 0;

                return (
                <Card key={gIdx} className="relative border-dashed border-2 hover:border-solid transition-all shadow-none hover:shadow-md">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive z-10" onClick={() => removeGroup(gIdx)}><Trash2 className="h-4 w-4" /></Button>

                    <CardContent className="pt-6 space-y-6">
                        {/* Group Header Edit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pb-4 border-b">
                            <div className="lg:col-span-2 space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Group Name</label>
                                <Input value={group.name} onChange={(e) => updateGroup(gIdx, 'name', e.target.value)} className="font-bold text-lg" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                                <Select value={group.type || "NEEDS"} onValueChange={(val) => updateGroup(gIdx, 'type', val)}>
                                    <SelectTrigger className={cn("font-bold", group.type === 'WANTS' ? 'text-purple-600' : 'text-primary')}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEEDS">Needs 🛡️</SelectItem>
                                        <SelectItem value="WANTS">Wants 💜</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {PRESET_COLORS.map(c => (
                                        <div key={c} className={cn("w-5 h-5 rounded-full cursor-pointer", group.color === c ? "ring-2 ring-black dark:ring-white" : "")} style={{ backgroundColor: c }} onClick={() => updateGroup(gIdx, 'color', c)} />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Icon</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-xl">{group.icon}</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2 flex flex-wrap gap-2">
                                        <div className="w-full mb-2">
                                            <Input placeholder="Type custom emoji..." maxLength={2} value={group.icon} onChange={(e) => updateGroup(gIdx, 'icon', e.target.value)} className="text-center text-lg" />
                                        </div>
                                        {PRESET_EMOJIS.map(em => (
                                            <div key={em} className="p-2 cursor-pointer hover:bg-muted rounded text-xl" onClick={() => updateGroup(gIdx, 'icon', em)}>{em}</div>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        
                        {/* LEAF MODE INPUTS */}
                        {isLeaf && (
                            <div className="bg-primary/5 p-4 rounded-xl space-y-4 border border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                                         <Sparkles className="w-4 h-4" /> Simple Group Mode
                                    </div>
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <button 
                                            className={cn("px-3 py-1 text-xs rounded-md font-medium transition-all", group.targetGroup ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-background/50")}
                                            onClick={() => setGroupTarget(gIdx, availableGroups[0] || "Housing")}
                                        >
                                            By Group
                                        </button>
                                        <button 
                                            className={cn("px-3 py-1 text-xs rounded-md font-medium transition-all", !group.targetGroup ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-background/50")}
                                            onClick={() => updateGroup(gIdx, 'targetGroup', "")}
                                        >
                                            By Categories
                                        </button>
                                        {group.targetGroup && (
                                            // Removed Smart Edit button per user request
                                            <></>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold uppercase text-muted-foreground">Limit</label>
                                         <MoneyInput value={group.limit || 0} onValueChange={(val) => updateGroup(gIdx, 'limit', Number(val))} className="h-9" />
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold uppercase text-muted-foreground">Tracking</label>
                                         <Select value={group.trackingType} onValueChange={(val) => updateGroup(gIdx, 'trackingType', val)}>
                                             <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                             <SelectContent><SelectItem value="DAILY">Daily</SelectItem><SelectItem value="WEEKLY">Weekly</SelectItem><SelectItem value="MONTHLY">Monthly</SelectItem></SelectContent>
                                         </Select>
                                     </div>
                                </div>

                                {group.targetGroup ? (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Target Category Group</label>
                                        <Select value={group.targetGroup} onValueChange={(val) => setGroupTarget(gIdx, val)}>
                                            <SelectTrigger className="h-9 bg-background"><SelectValue placeholder="Select a group..." /></SelectTrigger>
                                            <SelectContent>
                                                {availableGroups.map(grp => (
                                                    <SelectItem key={grp} value={grp}>{grp}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        
                                        <div className="mt-3 bg-muted/50 p-2 rounded-lg border">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Included Categories</p>
                                            <div className="flex flex-wrap gap-1">
                                                {categories.filter(c => c.group === group.targetGroup).map(c => (
                                                    <Badge key={c._id} variant="secondary" className="text-[10px] h-5 bg-background border shadow-sm">
                                                        {c.name}
                                                    </Badge>
                                                ))}
                                                {categories.filter(c => c.group === group.targetGroup).length === 0 && (
                                                    <span className="text-[10px] text-muted-foreground italic">No categories found in this group.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Select Specific Categories</label>
                                        <CompactCategorySelect 
                                            selected={group.categories || []}
                                            onSelect={(newCats) => toggleGroupCat(gIdx, newCats)}
                                            categories={categories}
                                            usedCategories={[]} // Only filter if strictly necessary, but for now relaxed
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Items List */}
                        {!isLeaf && (
                            <div className="space-y-3">
                                {group.items.map((item, iIdx) => (
                                    <div key={iIdx} className="bg-muted/30 p-4 rounded-xl space-y-3 border relative group/item">
                                         <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity" onClick={() => removeItem(gIdx, iIdx)}><X className="h-3 w-3" /></Button>
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                             <div className="space-y-1">
                                                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Item Name</label>
                                                 <Input value={item.name} onChange={(e) => updateItem(gIdx, iIdx, 'name', e.target.value)} className="h-8" />
                                             </div>
                                             <div className="space-y-1">
                                                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Limit</label>
                                                  <MoneyInput value={item.limit} onValueChange={(val) => updateItem(gIdx, iIdx, 'limit', Number(val))} className="h-8" />
                                             </div>
                                             <div className="space-y-1">
                                                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Tracking</label>
                                                 <Select value={item.trackingType} onValueChange={(val) => updateItem(gIdx, iIdx, 'trackingType', val)}>
                                                     <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                     <SelectContent><SelectItem value="DAILY">Daily</SelectItem><SelectItem value="WEEKLY">Weekly</SelectItem><SelectItem value="MONTHLY">Monthly</SelectItem></SelectContent>
                                                 </Select>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block">Categories</label>
                                             <CompactCategorySelect 
                                                 selected={item.categories}
                                                 onSelect={(newCats) => toggleItemCat(gIdx, iIdx, newCats)}
                                                 categories={categories}
                                                 usedCategories={getUsedCategories(gIdx, iIdx)}
                                             />
                                         </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex gap-2">
                            {/* Only allow adding sub-items if NOT using targetGroup (logic complexity avoidance) */}
                            {!group.targetGroup && (
                                <Button variant="outline" size="sm" onClick={() => addItem(gIdx)} className="flex-1 border-dashed">
                                     <Plus className="w-3 h-3 mr-1" /> {isLeaf ? "Add First Sub-Item (Converts to Complex)" : "Add Sub-Item"}
                                </Button>
                            )}
                            {group.targetGroup && (
                                 <p className="text-[10px] text-muted-foreground bg-amber-50 dark:bg-amber-900/10 p-2 rounded w-full text-center">
                                    Sub-items are disabled when budgeting by Group.
                                 </p>
                            )}
                        </div>

                    </CardContent>
                </Card>
            )})}

            <Button variant="outline" className="w-full border-dashed py-8 h-auto flex flex-col gap-2 hover:bg-muted/50 transition-colors" onClick={addGroup}>
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                     <Plus className="h-6 w-6" />
                </div>
                <span className="font-bold text-lg">Add New Budget Group</span>
            </Button>
        </div>
    )
}

function BudgetSkeleton() {
    return <div className="space-y-4 animate-pulse"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>;
}
