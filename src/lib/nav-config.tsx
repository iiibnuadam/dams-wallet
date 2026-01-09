import { LayoutDashboard, Wallet, History, Repeat, Target, BarChart3 } from "lucide-react";

export const NAV_LINKS = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/wallets", label: "Wallets", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/routines", label: "Routines", icon: Repeat },
    { href: "/debts", label: "Debt & Receivables", icon: History },
];
