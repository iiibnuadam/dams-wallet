import { Navbar } from "@/components/Navbar";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFilters } from "@/components/TransactionFilters";
import { getWallets } from "@/services/wallet.service";
import { getTransactions } from "@/services/transaction.service"; // Use new service
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { User, Users, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<any> }) {
    await dbConnect();
    const params = await searchParams;

    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = (session?.user as any)?.username || session?.user?.name;

    const wallets = await getWallets(); // For filter dropdown

    // Inject currentUser into params for filtering
    const queryParams = { ...params, currentUser, limit: 15 };

    // Fetch Data using centralized service
    const { transactions, pagination } = await getTransactions(queryParams);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
            <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
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
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg self-start sm:self-auto">
                            {["ME", "OTHERS", "ALL"].map((f) => {
                                    const isActive = (params.userFilter || "ME") === f;
                                    return (
                                    <Link 
                                        key={f}
                                        href={`/transactions?${new URLSearchParams({ ...params, userFilter: f, page: "1" }).toString()}`}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                                            isActive ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                        replace={true}
                                        scroll={false} 
                                    >
                                        {f === "ME" && <User className="w-3 h-3" />}
                                        {f === "OTHERS" && <Users className="w-3 h-3" />}
                                        {f === "ME" ? "My Activity" : f === "OTHERS" ? "Partner" : "All"}
                                    </Link>
                                    );
                            })}
                        </div>
                    </div>

                    <TransactionFilters wallets={wallets as any[]} />
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-1 border dark:border-zinc-800">
                    <TransactionList transactions={transactions} pagination={pagination} />
                </div>
            </main>

        </div>
    );
}
