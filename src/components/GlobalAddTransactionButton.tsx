"use client";

import { usePathname } from "next/navigation";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GlobalAddTransactionButtonProps {
    wallets: any[];
}

export function GlobalAddTransactionButton({ wallets }: GlobalAddTransactionButtonProps) {
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith("/auth");

    if (isAuthPage) return null;

    return (
        <div className="hidden lg:block fixed bottom-8 right-8 z-50">
             <AddTransactionDialog 
                wallets={wallets} 
                defaultWalletId={undefined}
                trigger={
                    <Button size="lg" className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105">
                        <Plus className="w-8 h-8" />
                    </Button>
                }
            />
        </div>
    );
}
