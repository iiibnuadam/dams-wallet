import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { WalletHeaderSkeleton } from "@/components/skeletons";

export default async function WalletLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
    // Note: Do not await params for blocking data here if possible, 
    // but we need 'id' for the Header.
    // However, awaiting 'params' itself is fast (Next.js internals).
    // The previous blocking was awaiting `getWalletById`.
    
    const { id } = await params;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation */}
        <Link href="/wallets" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Wallets
        </Link>
        
        {/* Wallet Header - Suspended for Non-Blocking UI */}
        <Suspense fallback={<WalletHeaderSkeleton />}>
            <WalletHeader id={id} />
        </Suspense>

        {/* Dynamic Content */}
        {children}
      </main>
    </div>
  );
}
