import { IWallet, WalletType } from "@/types/wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Wallet, Landmark, Banknote, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWalletGradient, getWalletIconComponent } from "@/lib/constants";

interface WalletCardProps {
  wallet: IWallet; // In a real app we might use a DTO or serialized type since Date objects don't pass to client easily if strict, but Mongoose docs usually OK if treated right or we sanitize.
}

// Helper to format currency (IDR)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};



export function WalletCard({ wallet }: WalletCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const balance = (wallet as any).currentBalance ?? wallet.initialBalance;
  const Icon = getWalletIconComponent(wallet.type);

  return (
    <Link href={`/wallets/${wallet._id}`} className="block h-full group">
    <Card className={cn(
        "relative overflow-hidden border-none shadow-md transition-all hover:shadow-xl hover:scale-[1.02] h-full text-white bg-gradient-to-br", 
        getWalletGradient(wallet.color)
    )}>
      {/* Watermark Icon */}
      <div className="absolute -bottom-4 -right-4 opacity-20">
          <Icon className="w-32 h-32" />
      </div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-base font-bold opacity-90 truncate pr-2">
          {wallet.name}
        </CardTitle>
        <div className="rounded-full bg-white/20 p-2 text-white shrink-0 backdrop-blur-sm">
            <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold truncate tracking-tight">{formatCurrency(balance)}</div>
        <div className="text-xs opacity-75 mt-1 font-medium flex items-center gap-1">
          <span>{wallet.ownerName}</span>
          <span>•</span>
          <span className="capitalize">{wallet.type.toLowerCase()}</span>
        </div>
        
        {wallet.type === WalletType.LIABILITY && wallet.liabilityDetails && (
            <div className="mt-4 text-xs bg-black/20 p-2 rounded backdrop-blur-md inline-block">
                Tenor: {wallet.liabilityDetails.tenorMonths} months
            </div>
        )}
      </CardContent>
    </Card>
    </Link>
  );
}
