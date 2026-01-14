"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RoutineListSkeleton } from "@/components/skeletons";
import { getRoutinesAction } from "@/actions/routine"; 
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Loader2, Calendar, Repeat, ArrowRight, Wallet, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { deleteRoutineAction } from "@/actions/routine";
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
import { RoutineFormDialog } from "@/components/routine/RoutineFormDialog";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { updateRoutineAction } from "@/actions/routine";

interface RoutineListProps {
  wallets: any[];
}

export function RoutineList({ wallets }: RoutineListProps) {
    const [routines, setRoutines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRoutines = () => {
        getRoutinesAction().then(data => {
            setRoutines(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchRoutines();
    }, []);



    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
        
        // Optimistic update
        setRoutines(prev => prev.map(r => 
            r._id === id ? { ...r, status: newStatus } : r
        ));

        const res = await updateRoutineAction(id, { status: newStatus });
        if (!res.success) {
            // Revert if failed
            toast.error("Failed to update status");
            fetchRoutines();
        }
    };

    // Calculate Monthly Stats
    // Naive calculation assuming everything is Monthly for now, or just summing up the amounts as "Active Commitments"
    const totalExpense = routines
        .filter(r => r.type === "EXPENSE" || r.type === "TRANSFER") // Transfers are also money moving
        .reduce((sum, r) => sum + r.amount, 0);

    const totalIncome = routines
        .filter(r => r.type === "INCOME")
        .reduce((sum, r) => sum + r.amount, 0);

    if (loading) return <RoutineListSkeleton />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-100 dark:border-blue-900/50 p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Repeat className="w-24 h-24 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-2">
                             <ArrowDownLeft className="w-4 h-4" /> Monthly Commitments
                        </p>
                        <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalExpense)}
                        </h2>
                    </div>
                 </div>

                 <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Repeat className="w-24 h-24 text-emerald-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400 mb-1 flex items-center gap-2">
                             <ArrowUpRight className="w-4 h-4" /> Monthly Income
                        </p>
                        <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalIncome)}
                        </h2>
                    </div>
                 </div>
            </div>

            <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-lg font-semibold tracking-tight">Active List</h2>
                </div>
                <RoutineFormDialog wallets={wallets} onSaved={fetchRoutines} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {routines.map((routine) => {
                     const walletName = wallets.find(w => w._id === routine.wallet)?.name || "Unknown Wallet";
                     const targetWalletName = wallets.find(w => w._id === routine.targetWallet)?.name;
                     const isExpense = routine.type === "EXPENSE" || routine.type === "TRANSFER";

                     return (
                        <Card key={routine._id} className="relative overflow-hidden group hover:shadow-md transition-all">
                            <div className={`absolute top-0 left-0 w-1 h-full ${
                                routine.type === "EXPENSE" ? "bg-red-500" : 
                                routine.type === "INCOME" ? "bg-emerald-500" : "bg-blue-500"
                            }`} />
                            
                            <CardHeader className="pb-2 pl-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs font-normal bg-zinc-50 dark:bg-zinc-900">
                                                {routine.frequency}
                                            </Badge>
                                            <Badge variant={routine.status === "ACTIVE" ? "default" : "secondary"} className={routine.status === "ACTIVE" ? "bg-green-500 hover:bg-green-600" : ""}>
                                                {routine.status || "ACTIVE"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg leading-tight">{routine.description}</CardTitle>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`font-bold text-lg ${
                                             isExpense ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                                        }`}>
                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(routine.amount)}
                                        </div>
                                        <Switch 
                                            checked={routine.status === "ACTIVE" || !routine.status}
                                            onCheckedChange={() => handleToggleStatus(routine._id, routine.status || "ACTIVE")}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="pl-6 text-sm text-muted-foreground space-y-3 pb-3">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-3 h-3 text-zinc-400" />
                                    <span>{walletName}</span>
                                    {routine.type === "TRANSFER" && targetWalletName && (
                                        <>
                                            <ArrowRight className="w-3 h-3" />
                                            <span>{targetWalletName}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-zinc-400" />
                                    <span>Next run {formatDistanceToNow(new Date(routine.nextRun), { addSuffix: true })}</span>
                                    {/* <span className="text-xs">({format(new Date(routine.nextRun), "dd MMM")})</span> */}
                                </div>
                            </CardContent>

                            <CardFooter className="pl-6 pt-0 flex justify-end gap-1">
                                <RoutineFormDialog 
                                    wallets={wallets} 
                                    routine={routine} 
                                    onSaved={fetchRoutines}
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
                                            <AlertDialogTitle>Delete Routine?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this routine? Future transactions will not be generated.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={async () => {
                                                    await deleteRoutineAction(routine._id);
                                                    setRoutines(prev => prev.filter(r => r._id !== routine._id));
                                                }}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                     );
                })}
                
                {routines.length === 0 && (
                    <div className="col-span-full text-center py-12 border border-dashed rounded-lg bg-muted/20">
                        <p className="text-muted-foreground mb-4">No active routines found.</p>
                         <RoutineFormDialog wallets={wallets} onSaved={fetchRoutines} />
                    </div>
                )}
            </div>
        </div>
    );
}
