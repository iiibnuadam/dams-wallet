"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useSettleDebt } from "@/hooks/useDebts";

interface SettleDebtDialogProps {
  debt: any;
  trigger?: React.ReactNode;
  onSettled?: () => void;
  wallets: any[];
}

export function SettleDebtDialog({ debt, trigger, onSettled, wallets }: SettleDebtDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("");

  const { mutateAsync: settleDebt } = useSettleDebt();

  // Reset or set default wallet when opening
  useEffect(() => {
    if (open && wallets.length > 0 && !selectedWallet) {
         // Default to first capable wallet if possible, or just first one
         setSelectedWallet(wallets[0]._id);
    }
  }, [open, wallets, selectedWallet]);

  const handleSettle = async () => {
    if (!selectedWallet) return;
    setLoading(true);

    try {
        const res = await settleDebt({ id: debt._id, walletId: selectedWallet });
        setLoading(false);
        if (res.success) {
          setOpen(false);
          if (onSettled) onSettled();
          toast.success("Debt settled successfully");
        } else {
          toast.error(res.message || "Failed to settle debt");
        }
    } catch (e: any) {
        setLoading(false);
        toast.error(e.message || "Failed");
    }
  };

  const isLent = debt.type === "LENT";

  return (
    <ResponsiveDialog 
      open={open} 
      onOpenChange={setOpen}
      title={`Mark as ${isLent ? "Received" : "Paid"}`}
      description={isLent 
          ? `Confirm that you have received money from ${debt.person}.` 
          : `Confirm that you have paid back ${debt.person}.`
      }
      trigger={trigger || (
          <Button size="sm" variant="outline" className="gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settle
          </Button>
      )}
    >
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Amount to Settle</Label>
                <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(debt.amount)}
                </div>
                <p className="text-xs text-muted-foreground">
                    This will create a transaction record and update your wallet balance.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Select Wallet {isLent ? "(Deposit to)" : "(Pay from)"}</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a wallet" />
                    </SelectTrigger>
                    <SelectContent>
                        {wallets.map(w => {
                            const currentBalance = w.currentBalance || 0;
                            const isInsufficient = !isLent && currentBalance < debt.amount;
                            
                            return (
                                <SelectItem key={w._id} value={w._id} disabled={isInsufficient}>
                                    {w.name} ({new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(currentBalance)})
                                    {isInsufficient && " (Insufficient Funds)"}
                                </SelectItem>
                            );
                        })}
                        {wallets.length === 0 && (
                            <SelectItem value="none" disabled>No wallets found</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>

             <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                <Button onClick={handleSettle} disabled={loading || !selectedWallet}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm
                </Button>
            </div>
        </div>
    </ResponsiveDialog>
  );
}
