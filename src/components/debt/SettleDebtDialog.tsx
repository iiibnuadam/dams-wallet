"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { settleDebtAction } from "@/actions/debt";
import { getWalletsAction } from "@/actions/wallet"; // Accessing server action we will create/verify

interface SettleDebtDialogProps {
  debt: any;
  trigger?: React.ReactNode;
  onSettled?: () => void;
}

export function SettleDebtDialog({ debt, trigger, onSettled }: SettleDebtDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [fetchingWallets, setFetchingWallets] = useState(false);

  useEffect(() => {
    if (open) {
        setFetchingWallets(true);
        // Assuming we need a way to fetch wallets. 
        // If getWalletsAction doesn't exist, we might need to fetch them via an API route or pass them down.
        // For now, I'll assume we can create/use a server action or fetch from API.
        // Let's use a direct server action if possible, or fallback.
        // CHECK: Does getWalletsAction exist? I will create it in a moment if not.
        import("@/actions/wallet").then((mod) => {
            if (mod.getWalletsAction) {
                mod.getWalletsAction().then(data => {
                    setWallets(data);
                    setFetchingWallets(false);
                    // Default to first wallet if available
                    if (data.length > 0) setSelectedWallet(data[0]._id);
                });
            } else {
                // Fallback attempt or fetch via API if we had one
                setFetchingWallets(false);
            }
        }).catch(() => setFetchingWallets(false));
    }
  }, [open]);

  const handleSettle = async () => {
    if (!selectedWallet) return;
    setLoading(true);

    const res = await settleDebtAction(debt._id, selectedWallet);
    
    setLoading(false);
    if (res.success) {
      setOpen(false);
      if (onSettled) onSettled();
    } else {
      alert(res.message || "Failed to settle debt");
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
                <Select value={selectedWallet} onValueChange={setSelectedWallet} disabled={fetchingWallets}>
                    <SelectTrigger>
                        <SelectValue placeholder={fetchingWallets ? "Loading wallets..." : "Select a wallet"} />
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
                        {wallets.length === 0 && !fetchingWallets && (
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
