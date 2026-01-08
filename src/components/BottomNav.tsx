"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Plus, Wallet, MoreHorizontal, User, Repeat, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { AddWalletDialog } from "./AddWalletDialog";
import { Button } from "./ui/button";
import { useState } from "react";
import { ProfileDialog } from "@/components/ProfileDialog";
import { useSession } from "next-auth/react";

import { Link as LinkIcon, Menu, Moon, Sun, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useTheme } from "next-themes";

interface BottomNavProps {
    wallets: any[];
}

export function BottomNav({ wallets }: BottomNavProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [profileOpen, setProfileOpen] = useState(false);
    const { setTheme, theme } = useTheme();

    if (!session) return null;

    const isActive = (path: string) => pathname === path;

    // Extract wallet ID if on wallet detail page
    const getWalletIdFromPath = () => {
        const match = pathname?.match(/\/wallets\/([^\/]+)/);
        return match ? match[1] : undefined;
    };
    
    const currentWalletId = getWalletIdFromPath();

    return (
        <>
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t h-16 px-2 flex items-center justify-around z-40">
                <Link 
                    href="/" 
                    className={cn(
                        "flex flex-col items-center gap-1 min-w-[60px] text-[10px] font-medium transition-colors",
                        isActive("/") ? "text-primary" : "text-muted-foreground hover:text-primary"
                    )}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                </Link>

                <Link 
                    href="/wallets" 
                    className={cn(
                        "flex flex-col items-center gap-1 min-w-[60px] text-[10px] font-medium transition-colors",
                        isActive("/wallets") ? "text-primary" : "text-muted-foreground hover:text-primary"
                    )}
                >
                    <Wallet className="w-5 h-5" />
                    <span>Wallets</span>
                </Link>

                <div className="-mt-8">
                     <AddTransactionDialog 
                        wallets={wallets} 
                        defaultWalletId={currentWalletId}
                        trigger={
                            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Plus className="w-6 h-6" />
                            </Button>
                        }
                    />
                </div>

                <Link 
                    href="/transactions" 
                    className={cn(
                        "flex flex-col items-center gap-1 min-w-[60px] text-[10px] font-medium transition-colors",
                        isActive("/transactions") ? "text-primary" : "text-muted-foreground hover:text-primary"
                    )}
                >
                    <History className="w-5 h-5" />
                    <span>Transactions</span>
                </Link>

                <Drawer>
                    <DrawerTrigger asChild>
                        <button className="flex flex-col items-center gap-1 min-w-[60px] text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors outline-none">
                            <Menu className="w-5 h-5" />
                            <span>More</span>
                        </button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>Menu</DrawerTitle>
                        </DrawerHeader>
                        <div className="p-4 grid grid-cols-4 gap-4">
                             <Link 
                                href="/analytics" 
                                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className={cn("p-2 rounded-full bg-primary/10 text-primary", isActive("/analytics") && "bg-primary text-primary-foreground")}>
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-center">Analytics</span>
                            </Link>

                             <Link 
                                href="/routines" 
                                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className={cn("p-2 rounded-full bg-primary/10 text-primary", isActive("/routines") && "bg-primary text-primary-foreground")}>
                                    <Repeat className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-center">Routines</span>
                            </Link>

                             <Link 
                                href="/debts" 
                                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className={cn("p-2 rounded-full bg-primary/10 text-primary", isActive("/debts") && "bg-primary text-primary-foreground")}>
                                    <History className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-center">Debts</span>
                            </Link>

                            <button 
                                onClick={() => setProfileOpen(true)}
                                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="p-2 rounded-full bg-primary/10 text-primary">
                                    <User className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-medium text-center">Profile</span>
                            </button>
                        </div>
                        <div className="p-4 pb-8">
                            <div className="text-center text-xs text-muted-foreground">
                                v0.1.0 • Dams Wallet
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
            
            <ProfileDialog 
                open={profileOpen} 
                onOpenChange={setProfileOpen} 
            />
        </>
    );
}
