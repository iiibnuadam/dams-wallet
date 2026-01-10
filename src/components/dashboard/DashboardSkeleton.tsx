import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[180px] w-full rounded-xl" />
          <Skeleton className="h-[180px] w-full rounded-xl" />
        </section>

        {/* Analytics Summary */}
        <section className="space-y-4">
           {/* Pending Transactions Placeholder */}
           <Skeleton className="h-12 w-full rounded-lg" />
           <Skeleton className="h-48 w-full rounded-xl" />
        </section>

        {/* Goals Section */}
        <section className="space-y-4">
             <Skeleton className="h-8 w-48 mb-2" />
             <div className="space-y-3">
                 <Skeleton className="h-24 w-full rounded-lg" />
                 <Skeleton className="h-24 w-full rounded-lg" />
             </div>
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Wallets */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            </section>

            {/* Right Column: Category Breakdown */}
             <section className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[300px] w-full rounded-xl" />
            </section>
        </div>

        {/* Recent Transactions Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
             </div>
             <div className="space-y-3">
                 {[1, 2, 3, 4, 5].map((i) => (
                     <Skeleton key={i} className="h-16 w-full rounded-lg" />
                 ))}
             </div>
        </section>

      </main>
    </div>
  );
}
