"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, ArrowRight } from "lucide-react";
import { deleteTransaction } from "@/actions/transaction";
import { cn } from "@/lib/utils";

import { getCategoryColor } from "@/lib/category-utils";

interface TransactionDetailDialogProps {
    transaction: any; // Using any for simplicity as DTO varies, but ideally ITransaction
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({ transaction, open, onOpenChange }: TransactionDetailDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!transaction) return null;

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this transaction? This will revert the balance.")) return;
        
        setIsDeleting(true);
        const result = await deleteTransaction(transaction._id);
        setIsDeleting(false);

        if (result.success) {
            onOpenChange(false);
        } else {
            alert(result.message);
        }
    };

    const isExpense = transaction.type === "EXPENSE";
    const isIncome = transaction.type === "INCOME";
    const isTransfer = transaction.isTransfer;

    // Determine color
    const amountClass = isExpense ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400";
    const amountPrefix = isExpense ? "-" : "+";

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Transaction Details"
            description="View details or delete this transaction."
        >
            <div className="space-y-6">
                
                {/* Header Amount */}
                <div className="text-center py-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                        {isTransfer ? (isExpense ? "Transfer Out" : "Transfer In") : transaction.type}
                    </p>
                    <div className={cn("text-3xl font-bold", amountClass)}>
                        {amountPrefix} {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(transaction.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                        {format(new Date(transaction.date), "eeee, dd MMMM yyyy")}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid gap-4 text-sm">
                    {/* Description */}
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Description</span>
                        <span className="font-medium">{transaction.description || "-"}</span>
                    </div>

                    {/* Category */}
                    {!isTransfer && (
                        <div className="flex justify-between py-2 border-b items-center">
                            <span className="text-muted-foreground">Category</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded-md text-xs font-medium",
                                getCategoryColor(transaction.category?.name)
                            )}>
                                {transaction.category?.name || "Uncategorized"}
                            </span>
                        </div>
                    )}

                    {/* Wallet Info */}
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Wallet</span>
                        <span className="font-medium">{transaction.wallet?.name}</span>
                    </div>

                    {/* Transfer Details */}
                    {isTransfer && transaction.relatedTransaction && transaction.relatedTransaction.wallet && (
                         <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">{isExpense ? "To" : "From"}</span>
                            <span className="font-medium flex items-center gap-1">
                                {transaction.relatedTransaction.wallet.name}
                            </span>
                        </div>
                    )}

                    {/* Admin Fee or Fee Note */}
                    {/* We can't easily query the separate fee transaction here unless we passed it. 
                        But we can show a note if it looks like a transfer.
                    */}
                </div>

                {/* Actions */}
                <div className="pt-4">
                    <Button 
                        variant="destructive" 
                        className="w-full gap-2" 
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? "Deleting..." : "Delete Transaction"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                        Deleting this will automatically revert balances.
                    </p>
                </div>
            </div>
        </ResponsiveDialog>
    );
}
