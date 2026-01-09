"use client";

import { useState, useEffect } from "react";
import { TransactionDetailDialog } from "@/components/TransactionDetailDialog";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, CalendarClock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { fetchTransactionPage } from "@/actions/transaction";
import { getCategoryColor, getCategoryIcon } from "@/lib/category-utils";

// Interface for client prop (serialized)
interface TransactionDTO {
    _id: string;
    amount: number;
    description?: string;
    type: string;
    date: string; // ISO String
    category?: { name: string; icon?: string; color?: string };
    wallet: { name: string; _id: string };
    targetWallet?: { name: string; _id: string }; 
    isTransfer?: boolean;
    relatedTransaction?: { wallet?: { name: string; _id: string } };
    createdBy?: string;
}

interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
}

interface TransactionListProps {
  transactions: TransactionDTO[];
  pagination?: PaginationMeta;
  contextParams?: Record<string, string | number>;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

// Helper to format date groups
const formatDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  
  return date.toLocaleDateString("en-US", { weekday: 'long' });
};

export function TransactionList({ transactions: initialTransactions, pagination: initialPagination, contextParams }: TransactionListProps) {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<TransactionDTO[]>(initialTransactions);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionDTO | null>(null);

  const { ref, inView } = useIntersectionObserver();

  // Reset state when filters change (detected by initialTransactions changing usually, but better to sync)
  useEffect(() => {
    setTransactions(initialTransactions);
    setPagination(initialPagination);
  }, [initialTransactions, initialPagination]);

  const loadMore = async () => {
    if (loading || !pagination || pagination.currentPage >= pagination.totalPages) return;

    setLoading(true);
    const nextPage = pagination.currentPage + 1;
    
    // Convert search params to object
    const params: any = { page: nextPage, limit: 15, ...contextParams };
    searchParams.forEach((value, key) => { 
        if (key !== 'page') {
             params[key] = value; 
        }
    });

    const res = await fetchTransactionPage(params);
    
    if (res.success && res.data) {
        setTransactions(prev => {
            const newTxns = res.data.filter((newTx: TransactionDTO) => !prev.some((p) => p._id === newTx._id));
            return [...prev, ...newTxns];
        });
        if (res.pagination) setPagination(res.pagination);
    }
    setLoading(false);
  };


  useEffect(() => {
    if (inView) {
        loadMore();
    }
  }, [inView]);

  if (transactions.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed">
              <CalendarClock className="w-10 h-10 mb-3 opacity-20" />
              <p>No recent activity</p>
          </div>
      );
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, txn) => {
    const date = txn.date.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
    return groups;
  }, {} as Record<string, TransactionDTO[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <TransactionDetailDialog 
        open={!!selectedTx} 
        onOpenChange={(open) => !open && setSelectedTx(null)} 
        transaction={selectedTx} 
      />

      {sortedDates.map((date, index) => (
        <div key={date} className="relative">
          <div className="flex items-center justify-between mb-3 sticky top-0 py-3 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm z-10 border-b border-dashed border-zinc-200 dark:border-zinc-800 px-4 rounded-lg">
             <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {formatDateGroup(date)}
             </h3>
             <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {new Date(date).toLocaleDateString("en-US", { day: 'numeric', month: 'short' })}
             </span>
          </div>

          <div className="space-y-2">
            {groupedTransactions[date].map((txn) => {
               const CategoryIcon = getCategoryIcon(txn.category?.name);
               const categoryColorClass = getCategoryColor(txn.category?.name);
               
               return (
              <div 
                key={txn._id} 
                className="group relative flex items-start justify-between p-3 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all hover:shadow-sm hover:scale-[1.01] cursor-pointer"
                onClick={() => setSelectedTx(txn)}
              >
                <div className="flex items-start gap-4 min-w-0 w-full">
                  {/* Icon */}
                  <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                      (txn.type === "INCOME" && !txn.isTransfer) ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500" : 
                      (txn.type === "EXPENSE" && !txn.isTransfer) ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-500" : 
                      "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-500"
                  )}>
                      {/* Priority: Category Icon -> Type Icon */}
                      {CategoryIcon ? <CategoryIcon className="w-5 h-5" /> : (
                          <>
                            {txn.type === "INCOME" && !txn.isTransfer && <ArrowDownLeft className="w-5 h-5" />}
                            {txn.type === "EXPENSE" && !txn.isTransfer && <ArrowUpRight className="w-5 h-5" />}
                            {(txn.type === "TRANSFER" || txn.isTransfer) && <ArrowRightLeft className="w-5 h-5" />}
                          </>
                      )}
                  </div>
                  
                  {/* Content */}
                  {/* Content Container - Two Rows */}
                  <div className="flex flex-col gap-1.5 w-full min-w-0">
                      
                      {/* Row 1: Description & Amount */}
                      <div className="flex justify-between items-start gap-4">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight line-clamp-2 break-words">
                            {txn.description || txn.category?.name || "No description"}
                          </span>
                          
                          <span className={cn("font-bold text-sm tabular-nums whitespace-nowrap shrink-0", 
                                txn.type === "INCOME" ? "text-emerald-600 dark:text-emerald-500" : 
                                txn.type === "EXPENSE" ? "text-rose-600 dark:text-rose-500" : "text-blue-600 dark:text-blue-500"
                            )}>
                            {txn.type === "EXPENSE" ? "-" : "+"} {formatCurrency(txn.amount)}
                          </span>
                      </div>

                      {/* Row 2: Metadata (Full Width) */}
                      <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs text-muted-foreground w-full">
                          {txn.category && (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium md:shrink-0 w-fit",
                                categoryColorClass
                              )}>
                                  {txn.category.name}
                              </span>
                          )}
                          {(txn.type === "TRANSFER" || txn.isTransfer) ? (
                               <div className="flex items-center gap-1 text-[11px] min-w-0 text-zinc-500">
                                  <span className="truncate">{txn.wallet.name}</span> 
                                  <ArrowRight className="w-3 h-3 shrink-0" /> 
                                  <span className="truncate">{(txn.relatedTransaction?.wallet?.name || txn.targetWallet?.name || "?")}</span>
                               </div>
                          ) : (
                              <span className="truncate text-zinc-500">{txn.wallet.name}</span>
                          )}
                      </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      ))}
      
      {/* Infinite Scroll Trigger / Loader */}
      {pagination && pagination.currentPage < pagination.totalPages && (
          <div ref={ref} className="flex justify-center py-8">
              {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              ) : (
                  <span className="text-xs text-muted-foreground">Scroll to load more...</span>
              )}
          </div>
      )}
    </div>
  );
}
