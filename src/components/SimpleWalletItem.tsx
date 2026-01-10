import { IWallet, WalletType } from "@/types/wallet";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getWalletGradient, getWalletIconComponent } from "@/lib/constants";

interface SimpleWalletItemProps {
  wallet: IWallet;
}

// Helper to format currency (IDR)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function SimpleWalletItem({ wallet }: SimpleWalletItemProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const balance = (wallet as any).currentBalance ?? wallet.initialBalance;
  const Icon = getWalletIconComponent(wallet.type);
  const gradient = getWalletGradient(wallet.color);

  return (
    <Link href={`/wallets/${wallet._id}`} className="block group">
      <div className={cn(
          "relative overflow-hidden rounded-xl border border-white/10 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] hover:border-white/20",
          "bg-gradient-to-br", 
          gradient
      )}>
        {/* Watermark Icon */}
        <div className="absolute -right-4 -bottom-6 opacity-10 rotate-12 group-hover:opacity-20 transition-opacity">
            <Icon className="w-24 h-24 text-white" />
        </div>

        <div className="relative z-10 flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-base leading-tight group-hover:translate-x-1 transition-transform">{wallet.name}</h3>
                    <p className="text-xs text-white/70">{wallet.ownerName || wallet.owner}</p>
                </div>
            </div>
            
            <div className="text-right">
                <p className="font-bold text-lg tracking-tight">{formatCurrency(balance)}</p>
                 {wallet.type === WalletType.LIABILITY && wallet.liabilityDetails && (
                    <p className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded inline-block mt-1">
                        {wallet.liabilityDetails.tenorMonths}mo
                    </p>
                )}
            </div>
        </div>
      </div>
    </Link>
  );
}
