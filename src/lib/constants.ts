export const WALLET_COLORS = [
    { key: "BLUE", label: "Blue", gradient: "from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500", ring: "ring-blue-500" },
    { key: "GREEN", label: "Green", gradient: "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500", ring: "ring-emerald-500" },
    { key: "RED", label: "Red", gradient: "from-red-500 to-rose-600 dark:from-red-400 dark:to-rose-500", ring: "ring-red-500" },
    { key: "PURPLE", label: "Purple", gradient: "from-purple-500 to-violet-600 dark:from-purple-400 dark:to-violet-500", ring: "ring-purple-500" },
    { key: "ORANGE", label: "Orange", gradient: "from-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-500", ring: "ring-orange-500" },
    { key: "PINK", label: "Pink", gradient: "from-pink-500 to-fuchsia-600 dark:from-pink-400 dark:to-fuchsia-500", ring: "ring-pink-500" },
    { key: "BLACK", label: "Black", gradient: "from-zinc-800 to-zinc-950 dark:from-zinc-700 dark:to-zinc-900", ring: "ring-zinc-800" },
];

export const getWalletGradient = (key?: string) => {
    const color = WALLET_COLORS.find(c => c.key === key);
    return color ? color.gradient : WALLET_COLORS[0].gradient; // Default Blue
};

// Icon Mapping
import { Wallet, Landmark, Banknote, CreditCard, Coins } from "lucide-react";
import { WalletType } from "@/types/wallet";

export const getWalletIconComponent = (type: WalletType) => {
  switch (type) {
    case WalletType.BANK:
      return Landmark;
    case WalletType.EWALLET:
      return Wallet;
    case WalletType.CASH:
      return Banknote;
    case WalletType.LIABILITY:
      return CreditCard;
    case WalletType.INVESTMENT:
        return Coins;
    default:
      return Wallet;
  }
};
