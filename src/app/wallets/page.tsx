import { WalletList } from "@/components/wallet/WalletList";

export const dynamic = "force-dynamic";

export default function WalletsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                <WalletList />
            </main>
        </div>
    );
}
