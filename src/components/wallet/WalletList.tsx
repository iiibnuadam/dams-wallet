"use client";

import { useWallets } from "@/hooks/useWallets";
import { WalletCard } from "@/components/WalletCard";
import { AddWalletDialog } from "@/components/AddWalletDialog";
import { Wallet } from "lucide-react";
import { WalletListSkeleton } from "@/components/skeletons";

import { useSearchParams } from "next/navigation";
import { User, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useSession } from "next-auth/react";

export function WalletList() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    
    // Dynamic User Logic
    const currentUser = session?.user?.username || "ADAM";
    // Assuming 'Partner' is the 'other' user. Ideally we fetch partner from DB or config.
    // For now, let's hardcode the toggle logic based on who is logged in.
    // If ADAM is logged in -> Partner is SASTI.
    // If SASTI is logged in -> Partner is ADAM.
    const partnerUser = currentUser === "SASTI" ? "ADAM" : "SASTI";

    const currentView = searchParams.get("view") || currentUser;
    
    // Fetch with current view
    const { data: wallets = [], isLoading } = useWallets(currentView);

    if (isLoading || status === "loading") return <WalletListSkeleton />;

    // Calculate Stats
    // Ensure wallets is an array to prevent runtime errors
    const safeWallets = Array.isArray(wallets) ? wallets : [];
    if (!Array.isArray(wallets)) {
        console.error("WalletList: wallets data is not an array:", wallets);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assets = safeWallets.filter((w: any) => w.type !== "LIABILITY");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liabilities = safeWallets.filter((w: any) => w.type === "LIABILITY");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalAssets = assets.reduce((sum: number, w: any) => sum + (w.currentBalance ?? w.initialBalance ?? 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalLiabilities = Math.abs(liabilities.reduce((sum: number, w: any) => sum + (w.currentBalance ?? w.initialBalance ?? 0), 0));

    return (
        <section className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        My Wallets
                        <Wallet className="w-6 h-6" />
                    </h1>
                    <p className="text-muted-foreground">Manage your financial accounts.</p>
                </div>
                <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
                    {/* View Filter */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                        {[currentUser, partnerUser, "ALL"].map((v) => {
                            const isActive = currentView === v;
                            const newParams = new URLSearchParams(searchParams.toString());
                            newParams.set("view", v);
                            
                            let label = "All";
                            if (v === currentUser) label = "My Wallets";
                                if (v === partnerUser) label = "Partner";

                                return (
                                <Link 
                                    key={v}
                                    href={`/wallets?${newParams.toString()}`}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                                        isActive ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                    )}
                                    replace={true}
                                >
                                    {v === currentUser && <User className="w-3 h-3" />}
                                    {v === partnerUser && <Users className="w-3 h-3" />}
                                    {label}
                                </Link>
                                );
                        })}
                    </div>
                    <AddWalletDialog />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        {/* Landmark Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-400 mb-1 uppercase tracking-wider">Total Assets</p>
                        <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalAssets)}
                        </h2>
                        <p className="text-xs text-indigo-600/80 mt-1">{assets.length} Accounts</p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-100 dark:border-orange-900/50 p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        {/* Credit Card Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-400 mb-1 uppercase tracking-wider">Total Liabilities</p>
                        <h2 className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalLiabilities)}
                        </h2>
                        <p className="text-xs text-orange-600/80 mt-1">{liabilities.length} Accounts</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {wallets.map((wallet: any) => (
                    <WalletCard key={wallet._id} wallet={wallet} />
                ))}

                {wallets.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-lg border border-dashed text-sm">
                        No wallets found. Create one to get started.
                    </div>
                )}
            </div>
        </section>
    );
}
