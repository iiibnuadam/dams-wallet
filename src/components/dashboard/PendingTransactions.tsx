"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getPendingTransactionsAction, confirmTransactionAction, deleteTransactionAction } from "@/actions/routine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { checkAndGenerateRoutinesAction } from "@/actions/routine";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PendingTransactions() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPending = async () => {
        setLoading(true);
        try {
            await checkAndGenerateRoutinesAction(); // Lazy check on load
            const data = await getPendingTransactionsAction(); 
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch pending transactions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleConfirm = async (id: string) => {
        setProcessingId(id);
        const res = await confirmTransactionAction(id);
        if (res.success) {
            setTransactions(prev => prev.filter(t => t._id !== id));
            toast.success("Transaction confirmed");
        } else {
            toast.error(res.message);
        }
        setProcessingId(null);
    };

    const handleDelete = async (id: string) => {
        setProcessingId(id);
        const res = await deleteTransactionAction(id);
        if (res.success) {
            setTransactions(prev => prev.filter(t => t._id !== id));
        }
        setProcessingId(null);
    };

    if (loading && transactions.length === 0) return null; // Or skeleton
    if (transactions.length === 0) return null;

    return (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 mb-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-yellow-800 dark:text-yellow-500">
                    <Clock className="w-4 h-4" />
                    Pending Routines & Bills
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {transactions.map((t) => (
                    <div key={t._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-full",
                                t.type === "EXPENSE" ? "bg-red-100 text-red-600" :
                                t.type === "INCOME" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                            )}>
                                <RefreshCw className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{t.description}</p>
                                <div className="text-xs text-muted-foreground flex gap-2">
                                    <span>{format(new Date(t.date), "dd MMM yyyy")}</span>
                                    <span>•</span>
                                    <span>{t.wallet?.name}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                            <span className="font-bold text-sm">
                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(t.amount)}
                            </span>
                            
                            <div className="flex gap-1">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            disabled={!!processingId}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Skip/Delete Transaction?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to skip or delete this pending transaction? This cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDelete(t._id)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Skip/Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button 
                                    size="sm" 
                                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleConfirm(t._id)}
                                    disabled={!!processingId}
                                >
                                    {processingId === t._id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
