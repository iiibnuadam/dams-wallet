
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, ArrowUpRight, CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GoalHistoryListProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    history: any[];
    itemColorMap?: Record<string, string>;
}

export function GoalHistoryList({ history, itemColorMap = {} }: GoalHistoryListProps) {
    if (history.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-xl bg-muted/20">
                <CircleDollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No payments made yet.</p>
                <p className="text-xs">Pay/Cicil an item to see it here.</p>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(amount);
    };

    const router = useRouter();
    const [selectedTx, setSelectedTx] = useState<any>(null);

    return (
        <div className="space-y-4">
            <TransactionDetailDialog 
                open={!!selectedTx} 
                onOpenChange={(open) => !open && setSelectedTx(null)} 
                transaction={selectedTx}
                customDeleteAction={deleteGoalPaymentAction}
                onDeleteSuccess={() => {
                    router.refresh();
                }}
            />

            <h3 className="font-semibold text-lg">Payment History</h3>
            <div className="space-y-3 bg-card rounded-2xl border p-2 shadow-sm">
                {history.map((txn) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const itemId = typeof txn.goalItem === 'object' ? (txn.goalItem as any)?._id : txn.goalItem;
                    const color = itemColorMap[itemId] || "#10b981"; // Default to emerald-500
                    
                    return (
                        <div 
                            key={txn._id} 
                            onClick={() => setSelectedTx(txn)}
                            className="flex gap-4 p-4 border rounded-xl bg-card transition-colors hover:bg-muted/30 group relative cursor-pointer hover:shadow-sm hover:scale-[1.01] transition-all"
                            style={{
                                borderColor: `${color}40`, // 25% opacity border
                                backgroundColor: `${color}05` // 2% opacity background
                            }}
                        >
                            <div className="flex-shrink-0 mt-1">
                                <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                                    style={{
                                        backgroundColor: `${color}15`,
                                        color: color
                                    }}
                                >
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-foreground truncate text-base whitespace-break-spaces">
                                            {txn.description || "Payment"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {format(new Date(txn.date), "dd MMM yyyy, HH:mm")}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end">
                                        <p className="font-bold text-lg" style={{ color: color }}>
                                            {formatCurrency(txn.amount)}
                                        </p>
                                        {txn.paymentPhase && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 mt-1 border-0 bg-black/5">
                                                {txn.paymentPhase}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import { deleteGoalPaymentAction } from "@/actions/goal";
import { TransactionDetailDialog } from "@/components/TransactionDetailDialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
