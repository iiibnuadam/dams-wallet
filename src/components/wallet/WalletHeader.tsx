import { getWalletById, getWallets } from "@/services/wallet.service";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getWalletGradient, getWalletIconComponent } from "@/lib/constants";
import { User, CreditCard } from "lucide-react";
import { WalletViewToggle } from "@/components/WalletViewToggle";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { EditWalletDialog } from "@/components/EditWalletDialog";
import { CopyButton } from "@/components/ui/copy-button";
import dbConnect from "@/lib/db";

export async function WalletHeader({ id }: { id: string }) {
    await dbConnect();
    const wallet = await getWalletById(id);
    if (!wallet) notFound();

    const allWallets = await getWallets();
    const Icon = getWalletIconComponent(wallet.type);

    return (
        <Card className={cn("text-white border-none shadow-lg overflow-hidden relative bg-gradient-to-br", getWalletGradient(wallet.color))}>
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Icon className="w-32 h-32" />
             </div>
             <CardContent className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4 w-full md:w-auto">
                        <div>
                             <div className="flex items-center gap-2 mb-1 opacity-80">
                                <span className="uppercase tracking-wider text-xs font-semibold">{wallet.type}</span>
                                {wallet.owner && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                                        <User className="w-3 h-3" /> {wallet.owner}
                                    </span>
                                )}
                             </div>
                             <h1 className="text-3xl font-bold tracking-tight">{wallet.name}</h1>
                        </div>
                        
                        <div>
                             <div className="text-sm opacity-70 mb-1">Current Balance</div>
                             <div className="text-4xl font-bold">
                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(wallet.currentBalance || 0)}
                             </div>
                             
                             {/* Bank Details */}
                             {wallet.bankDetails && wallet.bankDetails.accountNumber && (
                                 <div className="mt-4 pt-4 border-t border-white/20">
                                     <div className="flex flex-col gap-1">
                                        <div className="text-sm opacity-80 flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            <span>
                                                {wallet.bankDetails.bankName || "Bank"} - {wallet.bankDetails.accountHolder || wallet.owner}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-black/20 px-2 py-1 rounded text-sm font-mono tracking-wide">
                                                {wallet.bankDetails.accountNumber}
                                            </code>
                                            <CopyButton value={wallet.bankDetails.accountNumber} />
                                        </div>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto items-center">
                        <div className="hidden md:block">
                            <WalletViewToggle />
                        </div>
                        <div className="hidden md:block">
                            <AddTransactionDialog wallets={allWallets} defaultWalletId={id} />
                        </div>
                        <EditWalletDialog wallet={wallet} />
                    </div>
                </div>
                {/* Mobile Toggle */}
                <div className="mt-4 md:hidden block">
                    <WalletViewToggle />
                </div>
             </CardContent>
        </Card>
    );
}
