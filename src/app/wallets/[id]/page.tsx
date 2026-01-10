
import { Suspense } from "react";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFilters } from "@/components/TransactionFilters";
import { History } from "lucide-react";
import { WalletAnalytics } from "@/components/wallet/WalletAnalytics";
import { WalletAnalyticsSkeleton, TransactionSkeleton } from "@/components/skeletons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function WalletPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<any> }) {
  const { id } = await params;
  const search = await searchParams;
  const view = search.view || "transactions";

  // If view is transactions, render client list directly.
  if (view === "transactions") {
      return (
          <>
            {/* Filters */}
            <div id="history" className="space-y-4">
                <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">Transactions</h2>
                </div>
            
                <TransactionFilters wallets={[]} showWalletFilter={false} />
            </div>

            {/* Transaction List */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border p-1">
                {/* We use Suspense here? No, TransactionList handles its own loading state via React Query */}
                {/* However, for initial hydration/mounting, it might be nice to show skeleton? */}
                {/* But React Query usually starts in loading state. */}
                <TransactionList 
                    contextParams={{ walletId: id }} 
                />
            </div>
            
            <p className="text-center text-xs text-muted-foreground italic">
                Showing transactions based on current filters. 
            </p>
        </>
      );
  }

  return (
      <Suspense fallback={<WalletAnalyticsSkeleton />}>
          <WalletAnalytics walletId={id} searchParams={search} />
      </Suspense>
  );
}
