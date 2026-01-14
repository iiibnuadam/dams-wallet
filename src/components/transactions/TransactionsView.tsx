"use client";

import { useSearchParams } from "next/navigation";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFilters } from "@/components/TransactionFilters";
import { useWallets } from "@/hooks/useWallets";
import { History, User, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TransactionSummaryStats } from "@/components/transactions/TransactionSummaryStats";

export function TransactionsView() {
    const searchParams = useSearchParams();
    const currentView = "ALL"; // Or derive from user session if needed, or pass prop if coming from wrapper. 
    // Actually, `useWallets` hook fetches wallets based on a VIEW, but the filter dropdown likely wants ALL wallets user has access to, or just "My Wallets". 
    // If I use "ALL", it fetches potentially everyone's if not careful.
    // Ideally we assume the user is "ME" context by default for fetching own wallets.
    // Let's use "ALL" for now as it seems to be the safe default in other files.
    
    // Fetch wallets for filtering
    const { data: wallets } = useWallets("ALL");

    // Reconstruct params for UI logic
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => { params[key] = value; });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
            <main className="max-w-7xl mx-auto px-4 py-8 space-y-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Transactions History
                        <History className="w-6 h-6" />
                    </h1>
                    <p className="text-muted-foreground">View and filter your financial activity.</p>
                </div>

                <div className="space-y-4">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                             <History className="w-5 h-5 text-muted-foreground" />
                             <h2 className="text-lg font-semibold">Activity Log</h2>
                        </div>
                        
                        {/* User Filter Controls */}
                        {/* User Filter Controls - Unifying with Budget View logic */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg self-start sm:self-auto">
                            {["ADAM", "SASTI", "ALL"].map((v) => {
                                    const currentView = searchParams.get("view") || "ADAM"; // Default to ADAM (Me)
                                    const isActive = currentView === v;
                                    
                                    // Construct new query params string
                                    const newParams = new URLSearchParams(searchParams.toString());
                                    newParams.set("view", v);
                                    newParams.delete("userFilter"); // Cleanup legacy
                                    newParams.set("page", "1");
                                    
                                    return (
                                    <Link 
                                        key={v}
                                        href={`/transactions?${newParams.toString()}`}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                                            isActive ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                        replace={true}
                                        scroll={false} 
                                    >
                                        {v === "ADAM" && <User className="w-3 h-3" />}
                                        {v === "SASTI" && <Users className="w-3 h-3" />}
                                        {v === "ADAM" ? "My Activity" : v === "SASTI" ? "Partner" : "All"}
                                    </Link>
                                    );
                            })}
                        </div>
                    </div>

                    {/* Transaction Summary Cards */}
                    <TransactionSummaryStats params={params} />

                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <TransactionFilters wallets={wallets as any[] || []} />
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-1 border dark:border-zinc-800">
                    <TransactionList />
                </div>
            </main>

        </div>
    );
}
