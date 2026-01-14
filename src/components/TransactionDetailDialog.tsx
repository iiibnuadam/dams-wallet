"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, ArrowRight } from "lucide-react";
import { deleteTransaction } from "@/actions/transaction";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { getCategoryColor } from "@/lib/category-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TransactionDetailDialogProps {
    transaction: any; // Using any for simplicity as DTO varies, but ideally ITransaction
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customDeleteAction?: (id: string) => Promise<{ success: boolean; message: string }>;
    onDeleteSuccess?: () => void;
}

export function TransactionDetailDialog({ transaction, open, onOpenChange, customDeleteAction, onDeleteSuccess }: TransactionDetailDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    if (!transaction) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await (customDeleteAction ? customDeleteAction(transaction._id) : deleteTransaction(transaction._id));
        setIsDeleting(false);
        setShowDeleteAlert(false);

        if (result.success) {
            onOpenChange(false);
            if (onDeleteSuccess) onDeleteSuccess();
        } else {
            toast.error(result.message);
        }
    };

    const isExpense = transaction.type === "EXPENSE";
    const isIncome = transaction.type === "INCOME";
    const isTransfer = transaction.isTransfer;

    // Determine color
    const amountClass = isExpense ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400";
    const amountPrefix = isExpense ? "-" : "+";

    return (
        <>
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

                        {/* Created By */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Created By</span>
                            <span className="font-medium">{transaction.createdBy || "Unknown"}</span>
                        </div>

                        {/* Category or Goal Indicator */}
                        {!isTransfer && (
                            <div className="flex justify-between py-2 border-b items-center">
                                <span className="text-muted-foreground">Category</span>
                                {transaction.goalItem ? (
                                     <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                        Goal Payment
                                     </span>
                                ) : (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-xs font-medium",
                                        getCategoryColor(transaction.category?.name)
                                    )}>
                                        {transaction.category?.name || "Uncategorized"}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Goal Name & Link */}
                        {transaction.goalItem && transaction.goalItem.goal && (
                            <div className="flex justify-between py-2 border-b items-center">
                                <span className="text-muted-foreground">Goal Name</span>
                                <Link 
                                    href={`/goals/${transaction.goalItem.goal._id}`}
                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    {transaction.goalItem.goal.name}
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        )}

                        {/* Goal Item Name */}
                        {transaction.goalItem && (
                            <div className="flex justify-between py-2 border-b items-center">
                                <span className="text-muted-foreground">Goal Item</span>
                                <span className="font-medium">{transaction.goalItem.name}</span>
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
                        {transaction.goalItem && !customDeleteAction ? (
                            <div className="space-y-3">
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-600 dark:text-blue-400">
                                    This is a goal payment. Please delete it from the specific Goal Detail page history to ensure proper budget reversion.
                                </div>
                                {transaction.goalItem.goal && (
                                    <Link href={`/goals/${transaction.goalItem.goal._id}`}>
                                        <Button variant="outline" className="w-full gap-2">
                                            Go to Goal Detail <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                <Button 
                                    variant="destructive" 
                                    className="w-full gap-2" 
                                    onClick={() => setShowDeleteAlert(true)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Transaction
                                </Button>
                                <p className="text-center text-xs text-muted-foreground mt-2">
                                    Deleting this will automatically revert balances.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </ResponsiveDialog>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the transaction and revert any balance changes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
