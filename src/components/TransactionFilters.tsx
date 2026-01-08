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
import { CalendarIcon, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategories } from "@/actions/category";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface TransactionFiltersProps {
    wallets: { _id: string; name: string }[];
    showWalletFilter?: boolean;
}

export function TransactionFilters({ wallets, showWalletFilter = true }: TransactionFiltersProps) {
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

    // Data for Categories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        async function fetchCats() {
            const data = await getCategories();
            setCategories(data);
        }
        fetchCats();
    }, []);

    const [isExpanded, setIsExpanded] = useState(false);

    // Apply Filters
    const applyFilters = () => {
        const params = new URLSearchParams();
        
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
        if (searchQuery) params.set("q", searchQuery);
        if (minAmount) params.set("minAmount", minAmount);
        if (maxAmount) params.set("maxAmount", maxAmount);

        const search = params.toString();
        const query = search ? `?${search}` : "";
        
        router.push(`${window.location.pathname}${query}`);
        // Optional: Collapse after applying? Maybe keep open.
    };

    const clearFilters = () => {
        setMode("MONTH");
        setMonth(format(new Date(), "yyyy-MM"));
        setStartDate(undefined);
        setEndDate(undefined);
        setType("ALL");
        setWalletId("ALL");
        setCategoryId("ALL");
        setSearchQuery("");
        setMinAmount("");
        setMaxAmount("");
        router.push(window.location.pathname); 
    };

    // Check if any filter is active to show indicator
    const hasActiveFilters = 
        mode === "RANGE" || 
        type !== "ALL" || 
        (walletId !== "ALL" && showWalletFilter) || 
        categoryId !== "ALL" || 
        !!minAmount || 
        !!maxAmount;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1 space-y-4">
             {/* Main Toolbar */}
             <div className="p-3 flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <Input 
                        placeholder="Search transactions..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                        className="pl-9 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-offset-0"
                    />
                </div>
                
                <div className="flex gap-2 shrink-0">
                    <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
                        <SheetTrigger asChild>
                            <Button 
                                variant="outline"
                                className={cn("gap-2", hasActiveFilters && "border-primary text-primary bg-primary/5")}
                            >
                                <FilterX className="w-4 h-4" />
                                Filters
                                {hasActiveFilters && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl sm:rounded-none sm:h-full sm:w-[400px] sm:max-w-none sm:border-l">
                            <SheetHeader className="mb-4 text-left">
                                <SheetTitle>Filter Transactions</SheetTitle>
                                <SheetDescription>
                                    Narrow down your transaction history.
                                </SheetDescription>
                            </SheetHeader>
                            
                            <div className="space-y-6 pb-20">
                                {/* Filter Inputs */}
                                <div className="space-y-4">
                                    {/* Period Mode */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">Time Period</label>
                                        <Select value={mode} onValueChange={(v: "MONTH" | "RANGE" | "ALL") => setMode(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MONTH">Specific Month</SelectItem>
                                                <SelectItem value="RANGE">Date Range</SelectItem>
                                                <SelectItem value="ALL">All Time</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Date Inputs based on Mode */}
                                    {mode === "MONTH" && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground ml-1">Select Month</label>
                                            <Input 
                                                type="month" 
                                                value={month} 
                                                onChange={(e) => setMonth(e.target.value)} 
                                            />
                                        </div>
                                    )}

                                    {mode === "RANGE" && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground ml-1">Start Date</label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {startDate ? format(startDate, "PP") : "Pick"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground ml-1">End Date</label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {endDate ? format(endDate, "PP") : "Pick"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Show Wallet Filter primarily if enabled */}
                                    {showWalletFilter && (
                                         <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground ml-1">Wallet</label>
                                            <Select value={walletId} onValueChange={setWalletId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Wallets" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">All Wallets</SelectItem>
                                                    {wallets.map((w) => (
                                                        <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">Category</label>
                                        <Select value={categoryId} onValueChange={setCategoryId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Categories" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">All Categories</SelectItem>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {categories
                                                    .filter((c: any) => type === "ALL" || c.type === type)
                                                    .map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                     <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">Min Amount</label>
                                        <MoneyInput 
                                            placeholder="0" 
                                            value={minAmount} 
                                            onValueChange={setMinAmount}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">Max Amount</label>
                                        <MoneyInput 
                                            placeholder="∞" 
                                            value={maxAmount} 
                                            onValueChange={setMaxAmount}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                                    Reset
                                </Button>
                                <Button className="flex-1" onClick={() => { applyFilters(); setIsExpanded(false); }}>
                                    Show Results
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Button onClick={applyFilters}>
                        Search
                    </Button>
                </div>
            </div>

            {/* Quick Date Pills (Wrap) */}
            <div className="px-3 pb-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 border-b border-zinc-100 dark:border-zinc-800">
                {/* Date Group */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Button 
                        variant={mode === "MONTH" && month === format(new Date(), "yyyy-MM") ? "default" : "outline"} 
                        size="sm" 
                        className="rounded-full h-8 text-xs whitespace-nowrap"
                        onClick={() => { setMode("MONTH"); setMonth(format(new Date(), "yyyy-MM")); }}
                    >
                        This Month
                    </Button>
                    <Button 
                        variant={mode === "MONTH" && month === format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM") ? "default" : "outline"} 
                        size="sm" 
                        className="rounded-full h-8 text-xs whitespace-nowrap"
                        onClick={() => { setMode("MONTH"); setMonth(format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM")); }}
                    >
                        Last Month
                    </Button>
                </div>
                
                {/* Divider (Desktop Only) */}
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 self-center shrink-0 hidden sm:block"></div>
                
                {/* Type Group */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Button 
                        variant={type === "ALL" ? "secondary" : "ghost"} 
                        size="sm" 
                        className="rounded-full h-8 text-xs whitespace-nowrap"
                        onClick={() => setType("ALL")}
                    >
                        All Types
                    </Button>
                    <Button 
                        variant={type === "INCOME" ? "secondary" : "ghost"} 
                        size="sm" 
                        className="rounded-full h-8 text-xs whitespace-nowrap text-emerald-600 dark:text-emerald-400"
                        onClick={() => setType("INCOME")}
                    >
                        Income
                    </Button>
                    <Button 
                        variant={type === "EXPENSE" ? "secondary" : "ghost"} 
                        size="sm" 
                        className="rounded-full h-8 text-xs whitespace-nowrap text-red-600 dark:text-red-400"
                        onClick={() => setType("EXPENSE")}
                    >
                        Expense
                    </Button>
                </div>
            </div>
        </div>
    );
}
