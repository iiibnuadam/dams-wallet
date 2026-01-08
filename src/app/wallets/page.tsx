import { Navbar } from "@/components/Navbar";
import { getWallets } from "@/services/wallet.service";
import { WalletCard } from "@/components/WalletCard";
import { AddWalletDialog } from "@/components/AddWalletDialog";

export const dynamic = "force-dynamic";

export default async function WalletsPage() {
    const wallets = await getWallets();

    // Calculate Stats
    // Assuming Liability balance is negative for net worth, but we want positive for display
    // Or if it matches normal accounting, Assets are positive, Liabilities negative.
    // Let's sum absolute values for display purposes.
    
    const assets = wallets.filter((w: any) => w.type !== "LIABILITY");
    const liabilities = wallets.filter((w: any) => w.type === "LIABILITY");

    const totalAssets = assets.reduce((sum: number, w: any) => sum + (w.currentBalance || 0), 0);
    // For liabilities, if stored as negative, we invert. If stored as positive debt, we keep.
    // Based on dashboard logic using sum, usually liabilities might be negative.
    // Let's display absolute magnitude for "Total Liabilities".
    const totalLiabilities = Math.abs(liabilities.reduce((sum: number, w: any) => sum + (w.currentBalance || 0), 0));

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
            
            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                <section className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight">My Wallets</h1>
                        <AddWalletDialog />
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
            </main>
        </div>
    );
}
