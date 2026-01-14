import { LayoutDashboard, Wallet, History, Repeat, Target, BarChart3, PiggyBank, Settings } from "lucide-react";

export interface NavLink {
    href: string;
    label: string;
    icon: any;
    roles?: ("ADMIN" | "USER")[];
}

export const NAV_LINKS: NavLink[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/budget", label: "Budget", icon: PiggyBank },
    { href: "/wallets", label: "Wallets", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/routines", label: "Routines", icon: Repeat },
    { href: "/debts", label: "Debt & Receivables", icon: History },
    { href: "/categories", label: "Categories", icon: Settings, roles: ["ADMIN"] },
];
