import { Skeleton } from "@/components/ui/skeleton";

export function TransactionSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((group) => (
        <div key={group} className="space-y-4">
          <div className="flex justify-between items-center">
             <Skeleton className="h-6 w-32 rounded-lg" />
             <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 border rounded-2xl">
                <div className="flex items-center gap-4 w-full">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex justify-between">
                         <Skeleton className="h-3 w-1/4" />
                         <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GoalListSkeleton() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
            {[1, 2].map((i) => (
                <div key={i} className="relative overflow-hidden rounded-[32px] bg-card border border-border/50 h-[300px] p-7 flex flex-col">
                    <div className="flex gap-5 items-center mb-6">
                         <Skeleton className="w-16 h-16 rounded-2xl" />
                         <div className="space-y-2">
                             <Skeleton className="h-8 w-48" />
                             <Skeleton className="h-4 w-32" />
                         </div>
                    </div>
                    <div className="space-y-2 mb-6">
                        <Skeleton className="h-3 w-20 mb-2" />
                        <div className="flex items-baseline gap-2">
                             <Skeleton className="h-10 w-40" />
                             <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-auto">
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-20 rounded-2xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function GoalDetailSkeleton() {
    return (
        <div className="min-h-screen max-w-7xl pb-20 py-8 mx-auto space-y-8">
            <div className="px-4">
               <Skeleton className="h-5 w-32" />
            </div>
            
            <div className="container px-4">
                 <div className="rounded-[32px] bg-card border h-[550px] p-8 space-y-8">
                      <div className="flex justify-between items-center">
                           <div className="flex gap-4 items-center">
                               <Skeleton className="w-10 h-10 md:w-20 md:h-20 rounded-[20px]" />
                               <div className="space-y-3">
                                   <Skeleton className="h-10 w-40 md:w-64" />
                                   <Skeleton className="h-5 w-32 md:w-40" />
                               </div>
                           </div>
                           <Skeleton className="h-10 w-12 md:w-32" />
                      </div>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-12">
                          <div className="space-y-4">
                               <Skeleton className="h-4 w-32" />
                               <Skeleton className="h-16 w-3/4" />
                               <Skeleton className="h-8 w-40 rounded-full" />
                          </div>
                           <div className="grid grid-cols-2 gap-4">
                               <Skeleton className="h-32 rounded-2xl" />
                               <Skeleton className="h-32 rounded-2xl" />
                           </div>
                      </div>

                      <div className="mt-auto">
                           <Skeleton className="h-4 w-full rounded-full" />
                      </div>
                 </div>
            </div>

            <div className="px-4">
                <Skeleton className="h-12 w-64 rounded-full mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function DebtListSkeleton() {
    return (
        <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-40 rounded-xl" />
                  <Skeleton className="h-40 rounded-xl" />
             </div>
             
             <div className="space-y-6">
                 <div className="flex justify-between items-center">
                     <Skeleton className="h-10 w-48 rounded-md" />
                     <Skeleton className="h-10 w-32 rounded-md" />
                 </div>
                 
                 <div className="space-y-8">
                      <div>
                           <Skeleton className="h-5 w-32 mb-4" />
                           <div className="grid gap-4 md:grid-cols-3">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-48 rounded-xl" />
                                ))}
                           </div>
                      </div>
                      <div>
                           <Skeleton className="h-5 w-32 mb-4" />
                           <div className="grid gap-4 md:grid-cols-3">
                                {[1, 2].map(i => (
                                    <Skeleton key={i} className="h-48 rounded-xl" />
                                ))}
                           </div>
                      </div>
                 </div>
             </div>
        </div>
    );
}

export function RoutineListSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
             {/* Summary Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-32 rounded-xl" />
                  <Skeleton className="h-32 rounded-xl" />
             </div>

             <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-10 rounded-md" />
             </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                                <Skeleton className="h-6 w-48" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                        <div className="space-y-2 pt-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                 ))}
             </div>
        </div>
    );
}

export function WalletListSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
            </div>

            {/* Wallet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export function AnalyticsSkeleton() {
    return (
        <div className="min-h-screen max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4">
               <div className="flex justify-between items-center">
                   <div>
                       <Skeleton className="h-8 w-48 mb-2" />
                       <Skeleton className="h-4 w-32" />
                   </div>
               </div>
               <Skeleton className="h-10 w-full md:w-1/2" />
               <Skeleton className="h-24 w-full rounded-xl" />
            </div>

            {/* Macro View */}
            <div className="space-y-4">
                 <Skeleton className="h-6 w-32" />
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     <Skeleton className="h-64 rounded-xl" />
                     <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>

            {/* Spending Behavior */}
            <div className="space-y-4">
                 <Skeleton className="h-6 w-40" />
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                         <Skeleton className="h-40 rounded-xl" />
                         <Skeleton className="h-64 rounded-xl" />
                    </div>
                    <div className="lg:col-span-2">
                         <Skeleton className="h-[450px] rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function WalletDetailSkeleton() {
    return (
        <div className="min-h-screen max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
            <Skeleton className="h-4 w-32" />
            
            {/* Wallet Header Card */}
            <div className="rounded-xl border p-6 md:p-8 space-y-6 h-[280px] bg-card">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4 w-full">
                         <div className="space-y-2">
                             <Skeleton className="h-4 w-16" />
                             <Skeleton className="h-10 w-48" />
                         </div>
                         <div className="space-y-2">
                             <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-12 w-64" />
                         </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                 </div>
            </div>

            {/* List Skeleton */}
            <div className="space-y-4 pt-4">
                 <Skeleton className="h-8 w-40" />
                 <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                 </div>
            </div>
        </div>
    );
}

export function WalletContentSkeleton() {
    return (
        <div className="space-y-6 pt-2 animate-pulse">
            {/* Filter/Tab Skeleton */}
            <div className="flex items-center gap-2">
                 <Skeleton className="h-5 w-5 rounded-full" />
                 <Skeleton className="h-6 w-32" />
            </div>

            {/* List/Analytics Skeleton */}
            <div className="rounded-lg border p-1 h-[400px]">
                 <div className="space-y-4 p-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between items-center">
                            <div className="flex gap-4 items-center w-full">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
}

export function WalletAnalyticsSkeleton() {
    return (
        <div className="space-y-6 pt-2 animate-pulse">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                 </div>
                 <Skeleton className="h-10 w-full md:w-64" />
            </div>

             {/* Averages Cards */}
             <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
             </div>
            
             <Skeleton className="h-40 rounded-xl" />
             
             {/* Daily Trend Chart */}
             <div className="space-y-2">
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-48 rounded-xl" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Skeleton className="h-64 rounded-xl" />
                 <Skeleton className="h-64 rounded-xl" />
             </div>
        </div>
    );
}

export function WalletHeaderSkeleton() {
    return (
        <div className="rounded-xl border p-6 md:p-8 space-y-6 h-[280px] bg-card animate-pulse">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4 w-full">
                     <div className="space-y-2">
                         <Skeleton className="h-4 w-16" />
                         <Skeleton className="h-10 w-48" />
                     </div>
                     <div className="space-y-2">
                         <Skeleton className="h-4 w-24" />
                         <Skeleton className="h-12 w-64" />
                     </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
             </div>
        </div>
    );
}
