"use client";

import { useDebts, useDeleteDebt } from "@/hooks/useDebts";
import { toast } from "sonner";
import { useWallets } from "@/hooks/useWallets";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, ExternalLink, Calendar, Copy, ArrowUpRight, ArrowDownLeft, Wallet, AlertCircle } from "lucide-react";
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
import { DebtFormDialog } from "@/components/debt/DebtFormDialog";
import { SettleDebtDialog } from "@/components/debt/SettleDebtDialog";
import { format, isPast, isToday, addDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DebtListSkeleton } from "@/components/skeletons";

export function DebtList() {
    const { data: debts = [], isLoading } = useDebts();
    const { mutateAsync: deleteDebt } = useDeleteDebt();
    const { data: wallets = [] } = useWallets("ALL"); // Fetch wallets for Settle Dialog



    const copyReminder = (debt: any) => {
        const typeStr = debt.type === "LENT" ? "hutang kamu" : "hutang aku";
        const msg = `Halo ${debt.person}, mau ingetin ${typeStr} sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(debt.amount)} (${debt.description}). Boleh tolong dicek ya? makasih 🙏`;
        navigator.clipboard.writeText(msg);
        toast.success("Reminder message copied to clipboard!");
    };

    // Calculate Stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeDebts = debts.filter((d: any) => d.status === "ACTIVE");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalLent = activeDebts.filter((d: any) => d.type === "LENT").reduce((sum: number, d: any) => sum + d.amount, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalBorrowed = activeDebts.filter((d: any) => d.type === "BORROWED").reduce((sum: number, d: any) => sum + d.amount, 0);
    const totalVolume = totalLent + totalBorrowed;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCard = (debt: any) => {
        const isLent = debt.type === "LENT";
        const isPaid = debt.status === "PAID";
        const isOverdue = debt.dueDate && isPast(new Date(debt.dueDate)) && !isToday(new Date(debt.dueDate));
        const isDueSoon = debt.dueDate && !isPast(new Date(debt.dueDate)) && isPast(addDays(new Date(debt.dueDate), -3));

        return (
            <Card key={debt._id} className={`group relative overflow-hidden transition-all hover:shadow-md ${isPaid ? "opacity-60 bg-muted/40" : ""}`}>
                 {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                    isPaid ? "bg-zinc-300" :
                    isLent ? "bg-emerald-500" : "bg-rose-500"
                }`} />

                <CardHeader className="pb-2 pl-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                                {isLent ? "Owed by" : "Owed to"}
                            </div>
                            <CardTitle className="text-xl font-bold">{debt.person}</CardTitle>
                        </div>
                        <div className={`text-lg font-bold ${
                            isPaid ? "text-muted-foreground line-through" :
                            isLent ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}>
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(debt.amount)}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pb-3 pl-6 pt-0">
                    <p className="text-sm text-foreground/80 mb-3 line-clamp-2">
                        {debt.description || "No description"}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {isPaid ? (
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                Paid / Settled
                            </Badge>
                        ) : (
                            <>
                                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                                {isDueSoon && <Badge className="bg-amber-500 hover:bg-amber-600">Due Soon</Badge>}
                                {debt.dueDate && <Badge variant="outline">{format(new Date(debt.dueDate), "dd MMM")}</Badge>}
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                         <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(debt.loanDate || debt.createdAt), "dd MMM yyyy")}</span>
                         </div>
                         {debt.proofUrl && (
                            <a href={debt.proofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                                <ExternalLink className="w-3 h-3" /> Proof
                            </a>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="pt-0 pl-6 flex justify-between items-center">
                    <div className="flex gap-1">
                         <DebtFormDialog 
                            debt={debt} 
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Edit className="w-4 h-4" />
                                </Button>
                            } 
                        />
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Debt Record?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this debt record? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={async () => {
                                            try {
                                                await deleteDebt(debt._id);
                                                toast.success("Debt record deleted");
                                            } catch (error) {
                                                toast.error("Failed to delete");
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="flex gap-2">
                        {!isPaid && isLent && (
                            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => copyReminder(debt)}>
                                <Copy className="w-3 h-3 mr-1" /> Remind
                            </Button>
                        )}
                         {!isPaid && (
                            <SettleDebtDialog 
                                debt={debt} 
                                wallets={wallets as any[]}
                                trigger={
                                    <Button size="sm" className={`h-8 text-xs gap-1 ${
                                        isLent 
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                        : "bg-rose-600 hover:bg-rose-700 text-white"
                                    }`}>
                                        <Wallet className="w-3 h-3" />
                                        {isLent ? "Receive" : "Pay"}
                                    </Button>
                                }
                            />
                        )}
                    </div>
                </CardFooter>
            </Card>
        );
    };
    
    if (isLoading) return <DebtListSkeleton />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ArrowDownLeft className="w-24 h-24 text-emerald-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400 mb-1 flex items-center gap-2">
                             <ArrowDownLeft className="w-4 h-4" /> You're Owed
                        </p>
                        <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalLent)}
                        </h2>
                        <Progress value={totalVolume > 0 ? (totalLent / totalVolume) * 100 : 0} className="h-1 mt-3 bg-emerald-200 dark:bg-emerald-900" indicatorClassName="bg-emerald-500" />
                    </div>
                 </div>

                 <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/20 dark:to-rose-900/10 border border-rose-100 dark:border-rose-900/50 p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ArrowUpRight className="w-24 h-24 text-rose-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-rose-800 dark:text-rose-400 mb-1 flex items-center gap-2">
                             <ArrowUpRight className="w-4 h-4" /> You Owe
                        </p>
                        <h2 className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalBorrowed)}
                        </h2>
                        <Progress value={totalVolume > 0 ? (totalBorrowed / totalVolume) * 100 : 0} className="h-1 mt-3 bg-rose-200 dark:bg-rose-900" indicatorClassName="bg-rose-500" />
                    </div>
                 </div>
            </div>

            <div className="flex items-center justify-between">
                <Tabs defaultValue="ACTIVE" className="w-full">
                    <div className="flex items-center justify-between mb-6">
                         <TabsList>
                            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                            <TabsTrigger value="HISTORY">History</TabsTrigger>
                        </TabsList>
                        
                        <DebtFormDialog />
                    </div>

                    <TabsContent value="ACTIVE" className="space-y-8">
                        <div>
                             <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Receivables (Piutang)</h3>
                             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {activeDebts.filter((d: any) => d.type === "LENT").map(renderCard)}
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {activeDebts.filter((d: any) => d.type === "LENT").length === 0 && (
                                    <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl bg-muted/30">
                                        <p className="text-muted-foreground">No active receivables. Good for them!</p>
                                    </div>
                                )}
                             </div>
                        </div>

                        <div>
                             <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Payables (Utang)</h3>
                             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {activeDebts.filter((d: any) => d.type === "BORROWED").map(renderCard)}
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {activeDebts.filter((d: any) => d.type === "BORROWED").length === 0 && (
                                    <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl bg-muted/30">
                                        <p className="text-muted-foreground">No active debts. You are debt free!</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="HISTORY">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {debts.filter((d: any) => d.status === "PAID").map(renderCard)}
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {debts.filter((d: any) => d.status === "PAID").length === 0 && (
                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                    No history yet. Settle some debts to see them here.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
