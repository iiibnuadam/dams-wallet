"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, FilterX, X, Search, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoriesAction } from "@/actions/category-actions";
import { getGoalsAction } from "@/actions/goal";
import { Badge } from "@/components/ui/badge";
import { CategoryCombobox } from "@/components/ui/category-combobox";

interface TransactionFiltersProps {
    wallets: { _id: string; name: string }[];
    showWalletFilter?: boolean;
}

export function TransactionFilters({ wallets, showWalletFilter = true }: TransactionFiltersProps) {
    const safeWallets = Array.isArray(wallets) ? wallets : [];
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Filter State
    const [mode, setMode] = useState<"MONTH" | "RANGE" | "ALL">(
        searchParams.get("mode") as "MONTH" | "RANGE" | "ALL" || "MONTH"
    );
    const [month, setMonth] = useState<string>(searchParams.get("month") || format(new Date(), "yyyy-MM"));
    const [startDate, setStartDate] = useState<Date | undefined>(
        searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
         searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
    );
    
    const [type, setType] = useState<string>(searchParams.get("type") || "ALL");
    const [walletId, setWalletId] = useState<string>(searchParams.get("walletId") || "ALL");
    const [categoryId, setCategoryId] = useState<string>(searchParams.get("categoryId") || "ALL");
    const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") || "");
    const [minAmount, setMinAmount] = useState<string>(searchParams.get("minAmount") || "");
    const [maxAmount, setMaxAmount] = useState<string>(searchParams.get("maxAmount") || "");
    const [goalId, setGoalId] = useState<string>(searchParams.get("goalId") || "ALL");

    // Data for Categories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [goals, setGoals] = useState<any[]>([]);

    useEffect(() => {
        const loadCats = async () => {
            const data = await getCategoriesAction(); 
            setCategories(data);
        };
        async function fetchGoals() {
            const data = await getGoalsAction();
            setGoals(data);
        }
        loadCats();
        fetchGoals();
    }, []);


    const [isExpanded, setIsExpanded] = useState(false);

    // Apply Filters
    const applyFilters = () => {
        const params = new URLSearchParams();
        
        // Preserve userFilter and basic page params if needed (excluding page itself usually)
        if (searchParams.get("userFilter")) {
            params.set("userFilter", searchParams.get("userFilter")!);
        }
        
        // Mode Params
        params.set("mode", mode);
        if (mode === "MONTH") {
            params.set("month", month);
        } else if (mode === "RANGE") {
            if (startDate) params.set("startDate", format(startDate, "yyyy-MM-dd"));
            if (endDate) params.set("endDate", format(endDate, "yyyy-MM-dd"));
        }

        // Other Filters
        if (type && type !== "ALL") params.set("type", type);
        if (showWalletFilter && walletId && walletId !== "ALL") params.set("walletId", walletId);
        if (categoryId && categoryId !== "ALL") params.set("categoryId", categoryId);
        if (goalId && goalId !== "ALL") params.set("goalId", goalId);
        if (searchQuery) params.set("q", searchQuery);
        if (minAmount) params.set("minAmount", minAmount);
        if (maxAmount) params.set("maxAmount", maxAmount);

        // Always reset to page 1
        params.set("page", "1");

        const search = params.toString();
        const query = search ? `?${search}` : "";
        
        router.push(`${window.location.pathname}${query}`);
        setIsExpanded(false);
    };

    const clearFilters = () => {
        setMode("MONTH");
        setMonth(format(new Date(), "yyyy-MM"));
        setStartDate(undefined);
        setEndDate(undefined);
        setType("ALL");
        setWalletId("ALL");
        setCategoryId("ALL");
        setGoalId("ALL");
        setSearchQuery("");
        setMinAmount("");
        setMaxAmount("");
        
        // Push only preserved params
        const params = new URLSearchParams();
        if (searchParams.get("userFilter")) params.set("userFilter", searchParams.get("userFilter")!);
        if (searchParams.get("currentUser")) params.set("currentUser", searchParams.get("currentUser")!);
        
        // Default month reset
        params.set("mode", "MONTH");
        params.set("month", format(new Date(), "yyyy-MM"));
        
        router.push(`${window.location.pathname}?${params.toString()}`); 
    };

    // Better removal: Update state AND URL
    const safeRemove = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (key === 'q') {
            setSearchQuery("");
            params.delete("q");
        } else if (key === 'type') {
            setType("ALL");
            params.delete("type");
        } else if (key === 'walletId') {
            setWalletId("ALL");
            params.delete("walletId");
        } else if (key === 'categoryId') {
            setCategoryId("ALL");
            params.delete("categoryId");
        } else if (key === 'goalId') {
            setGoalId("ALL");
            params.delete("goalId");
        } else if (key === 'amount') {
            setMinAmount("");
            setMaxAmount("");
            params.delete("minAmount");
            params.delete("maxAmount");
        } else if (key === 'date') {
            // Reset to default this month
            setMode("MONTH");
            setMonth(format(new Date(), "yyyy-MM"));
            setStartDate(undefined);
            setEndDate(undefined);
            params.set("mode", "MONTH");
            params.set("month", format(new Date(), "yyyy-MM"));
            params.delete("startDate");
            params.delete("endDate");
        }

        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    // Active Filter Logic for Chips
    const activeFilters = [];
    
    // Date (Only show if NOT current month)
    const isDefaultDate = mode === "MONTH" && month === format(new Date(), "yyyy-MM");
    if (!isDefaultDate) {
        let label = "";
        if (mode === "MONTH") label = format(new Date(month), "MMM yyyy");
        else if (mode === "RANGE" && startDate && endDate) label = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM")}`;
        else if (mode === "ALL") label = "All Time";
        
        if (label) activeFilters.push({ key: 'date', label, value: label });
    }

    if (type && type !== "ALL") activeFilters.push({ key: 'type', label: `Type: ${type}`, value: type });
    if (showWalletFilter && walletId && walletId !== "ALL") {
        const w = wallets.find(w => w._id === walletId);
        activeFilters.push({ key: 'walletId', label: w ? w.name : "Wallet", value: walletId });
    }
    if (categoryId && categoryId !== "ALL") {
        const ids = categoryId.split(',');
        if (ids.length === 1) {
             const c = categories.find(c => c._id === ids[0]);
             activeFilters.push({ key: 'categoryId', label: c ? c.name : "Category", value: categoryId });
        } else {
             activeFilters.push({ key: 'categoryId', label: `${ids.length} Categories`, value: categoryId });
        }
    }
    if (goalId && goalId !== "ALL") {
        const g = goals.find(g => g._id === goalId);
        activeFilters.push({ key: 'goalId', label: `Goal: ${g ? g.name : "Unknown"}`, value: goalId });
    }
    if (minAmount || maxAmount) {
        activeFilters.push({ key: 'amount', label: `Amount: ${minAmount || 0} - ${maxAmount || '∞'}`, value: 'amount' });
    }


    return (
        <div className="space-y-3">
             {/* Filter Bar */}
             <div className="flex flex-col gap-3">
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search transactions..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                            className="pl-9 bg-background"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => safeRemove('q')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    
                    <Button 
                        variant={isExpanded ? "secondary" : "outline"} 
                        className="gap-2 shrink-0"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFilters.length > 0 && (
                            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 rounded-full text-[10px] pointer-events-none bg-background">
                                {activeFilters.length}
                            </Badge>
                        )}
                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-1 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 ml-1 text-muted-foreground" />}
                    </Button>
                 </div>

                 {/* Collapsible Filter Section */}
                 <div className={cn(
                     "grid overflow-hidden transition-all duration-300 ease-in-out bg-muted/30 rounded-lg border border-border/50",
                     isExpanded ? "grid-rows-[1fr] opacity-100 p-4 mb-2" : "grid-rows-[0fr] opacity-0 h-0 border-0"
                 )}>
                     <div className="min-h-0 overflow-hidden">
                        {/* Refined Grid: Use more columns on large screens, stack on mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                             {/* Date Filter */}
                             <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Time Period</label>
                                <div className="flex rounded-md shadow-sm">
                                    <Button 
                                        variant={mode === "MONTH" ? "default" : "outline"} 
                                        size="sm" 
                                        onClick={() => setMode("MONTH")}
                                        className="rounded-r-none flex-1 text-xs px-2 h-9"
                                    >
                                        Month
                                    </Button>
                                    <Button 
                                        variant={mode === "RANGE" ? "default" : "outline"} 
                                        size="sm" 
                                        onClick={() => setMode("RANGE")}
                                        className="rounded-none flex-1 text-xs px-2 h-9 border-l-0"
                                    >
                                        Range
                                    </Button>
                                    <Button 
                                        variant={mode === "ALL" ? "default" : "outline"} 
                                        size="sm" 
                                        onClick={() => setMode("ALL")}
                                        className="rounded-l-none flex-1 text-xs px-2 h-9 border-l-0"
                                    >
                                        All
                                    </Button>
                                </div>

                                {mode === "MONTH" && (
                                    <Input type="month" className="h-9" value={month} onChange={(e) => setMonth(e.target.value)} />
                                )}
                                {mode === "RANGE" && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal h-9 px-2", !startDate && "text-muted-foreground")}>
                                                    <span className="truncate">{startDate ? format(startDate, "dd MMM") : "Start"}</span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal h-9 px-2", !endDate && "text-muted-foreground")}>
                                                    <span className="truncate">{endDate ? format(endDate, "dd MMM") : "End"}</span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            </div>

                            {/* Type Filter (Self Contained) */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Type</label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Types</SelectItem>
                                        <SelectItem value="INCOME">Income</SelectItem>
                                        <SelectItem value="EXPENSE">Expense</SelectItem>
                                        <SelectItem value="GOAL">Goal Payment</SelectItem>
                                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Wallet Filter (Self Contained) */}
                            {showWalletFilter && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Wallet</label>
                                    <Select value={walletId} onValueChange={setWalletId}>
                                        <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="All Wallets" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Wallets</SelectItem>
                                            {safeWallets.map(w => <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Category Filter (Self Contained) */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Category</label>
                            <CategoryCombobox
                                    categories={[
                                        // Filter ALL option if multiple? Or handle custom?
                                        // Usually 'ALL' clears selection or selects all.
                                        // Let's keep ALL separate or allow it.
                                        // If user selects ALL, we should probably clear others?
                                        // For simplicity, remove ALL from list in multiple mode or handle carefully.
                                        // Current API expects "ALL" to clear.
                                        // If I select "ALL", it should set categoryId="ALL".
                                        { _id: "ALL", name: "All Categories" },
                                        ...categories.filter((c: any) => type === "ALL" || c.type === type)
                                    ]}
                                    value={categoryId}
                                    onChange={(val) => {
                                        if (Array.isArray(val)) {
                                            // Ensure uniqueness and handle "ALL"
                                            if (val.includes("ALL")) {
                                                // If ALL is selected, clear everything else?
                                                // Or if user clicks ALL, we set to ALL.
                                                // Logic: if new val contains ALL, set to ALL.
                                                // But val includes old selection.
                                                // If previously was NOT ALL, and now has ALL -> Set ALL.
                                                // If previously was ALL, and deselects ALL -> Empty?
                                                
                                                // Simpler: Just join. If "ALL" is in string, backend handles "ALL" as ignore?
                                                // Backend checks params.categoryId !== "ALL".
                                                // So if string is "ALL", it works.
                                                // If string is "A,B", fine.
                                                // If string "ALL, A", backend might fail.
                                                
                                                // My logic: If val contains "ALL", set to "ALL".
                                                // But handleSelect toggles.
                                                // Let's check if 'val' contains 'ALL' and it wasn't there before? Hard to know.
                                                
                                                // Improving:
                                                if (val.includes("ALL")) {
                                                     setCategoryId("ALL");
                                                } else {
                                                     setCategoryId(val.length > 0 ? val.join(',') : "ALL");
                                                }
                                            } else {
                                                setCategoryId(val.length > 0 ? val.join(',') : "ALL");
                                            }
                                        } else {
                                            setCategoryId(val);
                                        }
                                    }}
                                    placeholder="All Categories"
                                    multiple
                                />
                            </div>
                            
                            {/* Goal Filter (Self Contained) */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Goal</label>
                                <Select value={goalId} onValueChange={setGoalId}>
                                    <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="Goal" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Goals</SelectItem>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {goals.map((g: any) => (
                                            <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* Amount Range (Grouped) */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Amount Range</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <MoneyInput className="h-9 text-xs" placeholder="Min" value={minAmount} onValueChange={setMinAmount} />
                                    <MoneyInput className="h-9 text-xs" placeholder="Max" value={maxAmount} onValueChange={setMaxAmount} />
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end gap-2 pt-2 border-t mt-2">
                                <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
                                <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
                            </div>
                        </div>
                     </div>
                 </div>
                 
                 {/* Active Filters Chips */}
                 {activeFilters.length > 0 && (
                     <div className="flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-1">
                        {activeFilters.map(filter => (
                            <Badge key={filter.key} variant="secondary" className="pl-2 pr-1 py-1 gap-1 font-medium bg-muted/50 border-muted-foreground/20 text-foreground">
                                {filter.label}
                                <button 
                                    onClick={() => safeRemove(filter.key)}
                                    className="hover:bg-muted-foreground/20 rounded-full p-0.5 ml-1 transition-colors"
                                >
                                    <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </Badge>
                        ))}
                        
                        {(activeFilters.length > 2 || (activeFilters.length > 0 && !isDefaultDate)) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                onClick={clearFilters}
                            >
                                Clear All
                            </Button>
                        )}
                     </div>
                 )}
             </div>
        </div>
    );
}
