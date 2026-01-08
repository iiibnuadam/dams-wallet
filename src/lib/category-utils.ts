import { 
    Utensils, ShoppingBag, Car, Zap, Home, Film, HeartPulse, 
    GraduationCap, Plane, Gift, RefreshCw, Smartphone, Monitor, 
    Briefcase, Landmark 
} from "lucide-react";

// Map category names/icons to Lucide components
export const getCategoryIcon = (categoryName?: string) => {
    if (!categoryName) return null;
    const lower = categoryName.toLowerCase();
    
    if (lower.includes("food") || lower.includes("drink") || lower.includes("makan")) return Utensils;
    if (lower.includes("shopping") || lower.includes("belanja")) return ShoppingBag;
    if (lower.includes("transport")) return Car;
    if (lower.includes("utilit") || lower.includes("tagihan") || lower.includes("listrik") || lower.includes("air")) return Zap;
    if (lower.includes("hous") || lower.includes("rumah")) return Home;
    if (lower.includes("entertain") || lower.includes("movie") || lower.includes("hiburan")) return Film;
    if (lower.includes("health") || lower.includes("kesehatan")) return HeartPulse;
    if (lower.includes("educat") || lower.includes("pendidikan")) return GraduationCap;
    if (lower.includes("travel") || lower.includes("liburan")) return Plane;
    if (lower.includes("gift") || lower.includes("hadiah")) return Gift;
    if (lower.includes("subscrip") || lower.includes("foll")) return RefreshCw;
    if (lower.includes("top up") || lower.includes("wallet")) return Smartphone;
    if (lower.includes("electr")) return Monitor;
    if (lower.includes("salar") || lower.includes("work")) return Briefcase;
    if (lower.includes("invest") || lower.includes("bank")) return Landmark;
    
    return null;
};

// Map category names to colors
export const getCategoryColor = (categoryName?: string) => {
    if (!categoryName) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400";
    const lower = categoryName.toLowerCase();
    
    if (lower.includes("food") || lower.includes("drink") || lower.includes("makan")) return "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400";
    if (lower.includes("shopping") || lower.includes("belanja")) return "bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400";
    if (lower.includes("transport")) return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400";
    if (lower.includes("utilit") || lower.includes("tagihan") || lower.includes("listrik") || lower.includes("air")) return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    if (lower.includes("hous") || lower.includes("rumah")) return "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400";
    if (lower.includes("entertain") || lower.includes("movie") || lower.includes("hiburan")) return "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400";
    if (lower.includes("health") || lower.includes("kesehatan")) return "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400";
    if (lower.includes("educat") || lower.includes("pendidikan")) return "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400";
    if (lower.includes("travel") || lower.includes("liburan")) return "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400";
    if (lower.includes("gift") || lower.includes("hadiah")) return "bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400";
    if (lower.includes("subscrip") || lower.includes("foll")) return "bg-lime-100 dark:bg-lime-500/20 text-lime-700 dark:text-lime-400";
    if (lower.includes("salar") || lower.includes("gaji") || lower.includes("pemasukan")) return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
    if (lower.includes("invest")) return "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400";
    
    // Fallback hash-like color for others (simple rotation)
    const colors = [
        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
        "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300",
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    ];
    return colors[categoryName.length % colors.length];
};
