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
        <div className="absolute -right-3 -bottom-4 opacity-10 rotate-12 group-hover:opacity-20 transition-opacity">
            <Icon className="w-16 h-16 text-white" />
        </div>

        <div className="relative z-10 flex items-center justify-between p-3 text-white">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm leading-tight group-hover:translate-x-1 transition-transform">{wallet.name}</h3>
                    <p className="text-[11px] text-white/70">{wallet.ownerName || wallet.owner}</p>
                </div>
            </div>

            <div className="text-right">
                <p className="font-bold text-base tracking-tight">{formatCurrency(balance)}</p>
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
