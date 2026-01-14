export const WALLET_COLORS = [
    // Blues
    { key: "BLUE_300", label: "Blue Light", gradient: "from-blue-300 to-indigo-300 dark:from-blue-400 dark:to-indigo-400", ring: "ring-blue-300" },
    { key: "BLUE", label: "Blue", gradient: "from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500", ring: "ring-blue-500" },
    { key: "BLUE_800", label: "Blue Dark", gradient: "from-blue-800 to-indigo-900 dark:from-blue-700 dark:to-indigo-800", ring: "ring-blue-800" },

    // Emeralds
    { key: "EMERALD_300", label: "Emerald Light", gradient: "from-emerald-300 to-teal-300 dark:from-emerald-400 dark:to-teal-400", ring: "ring-emerald-300" },
    { key: "GREEN", label: "Green", gradient: "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500", ring: "ring-emerald-500" },
    { key: "EMERALD_800", label: "Emerald Dark", gradient: "from-emerald-800 to-teal-900 dark:from-emerald-700 dark:to-teal-800", ring: "ring-emerald-800" },

    // Reds
    { key: "RED_300", label: "Red Light", gradient: "from-red-300 to-rose-300 dark:from-red-400 dark:to-rose-400", ring: "ring-red-300" },
    { key: "RED", label: "Red", gradient: "from-red-500 to-rose-600 dark:from-red-400 dark:to-rose-500", ring: "ring-red-500" },
    { key: "RED_800", label: "Red Dark", gradient: "from-red-800 to-rose-900 dark:from-red-700 dark:to-rose-800", ring: "ring-red-800" },

    // Purples
    { key: "PURPLE_300", label: "Purple Light", gradient: "from-purple-300 to-violet-300 dark:from-purple-400 dark:to-violet-400", ring: "ring-purple-300" },
    { key: "PURPLE", label: "Purple", gradient: "from-purple-500 to-violet-600 dark:from-purple-400 dark:to-violet-500", ring: "ring-purple-500" },
    { key: "PURPLE_800", label: "Purple Dark", gradient: "from-purple-800 to-violet-900 dark:from-purple-700 dark:to-violet-800", ring: "ring-purple-800" },

    // Oranges
    { key: "ORANGE_300", label: "Orange Light", gradient: "from-orange-300 to-amber-300 dark:from-orange-400 dark:to-amber-400", ring: "ring-orange-300" },
    { key: "ORANGE", label: "Orange", gradient: "from-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-500", ring: "ring-orange-500" },
    { key: "ORANGE_800", label: "Orange Dark", gradient: "from-orange-800 to-amber-900 dark:from-orange-700 dark:to-amber-800", ring: "ring-orange-800" },

    // Pinks
    { key: "PINK_300", label: "Pink Light", gradient: "from-pink-300 to-fuchsia-300 dark:from-pink-400 dark:to-fuchsia-400", ring: "ring-pink-300" },
    { key: "PINK", label: "Pink", gradient: "from-pink-500 to-fuchsia-600 dark:from-pink-400 dark:to-fuchsia-500", ring: "ring-pink-500" },
    { key: "PINK_800", label: "Pink Dark", gradient: "from-pink-800 to-fuchsia-900 dark:from-pink-700 dark:to-fuchsia-800", ring: "ring-pink-800" },

    // Cyans
    { key: "CYAN_300", label: "Cyan Light", gradient: "from-cyan-300 to-sky-300 dark:from-cyan-400 dark:to-sky-400", ring: "ring-cyan-300" },
    { key: "CYAN_500", label: "Cyan", gradient: "from-cyan-500 to-sky-600 dark:from-cyan-400 dark:to-sky-500", ring: "ring-cyan-500" },
    { key: "CYAN_800", label: "Cyan Dark", gradient: "from-cyan-800 to-sky-900 dark:from-cyan-700 dark:to-sky-800", ring: "ring-cyan-800" },

    // Grays / Blacks
    { key: "GRAY_300", label: "Gray Light", gradient: "from-zinc-300 to-neutral-400 dark:from-zinc-400 dark:to-neutral-500", ring: "ring-zinc-300" },
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

export const SAFE_COLORS = [
    "#ef4444", // Red 500
    "#dc2626", // Red 600
    "#b91c1c", // Red 700
    "#f97316", // Orange 500
    "#ea580c", // Orange 600
    "#f59e0b", // Amber 500
    "#d97706", // Amber 600
    "#eab308", // Yellow 500
    "#ca8a04", // Yellow 600
    "#84cc16", // Lime 500
    "#65a30d", // Lime 600
    "#10b981", // Emerald 500
    "#059669", // Emerald 600
    "#14b8a6", // Teal 500
    "#0d9488", // Teal 600
    "#06b6d4", // Cyan 500
    "#0891b2", // Cyan 600
    "#0ea5e9", // Sky 500
    "#3b82f6", // Blue 500
    "#2563eb", // Blue 600
    "#6366f1", // Indigo 500
    "#4f46e5", // Indigo 600
    "#8b5cf6", // Violet 500
    "#7c3aed", // Violet 600
    "#a855f7", // Purple 500
    "#9333ea", // Purple 600
    "#d946ef", // Fuchsia 500
    "#c026d3", // Fuchsia 600
    "#ec4899", // Pink 500
    "#db2777", // Pink 600
    "#f43f5e", // Rose 500
    "#e11d48", // Rose 600
    "#64748b", // Slate 500
    "#334155", // Slate 700
    "#000000", // Black
];

export const PRESET_ICONS = ["🏠", "🚗", "🎓", "💍", "👶", "✈️", "🏥", "💻", "📱", "🛋️", "🔧", "🎉", "💰", "🏝️", "🚀", "❤️", "⭐", "🔥", "🎨", "⚽"];
