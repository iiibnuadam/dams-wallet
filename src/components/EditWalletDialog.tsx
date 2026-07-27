"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Loader2, Pencil, Check } from "lucide-react";
import { updateWallet, deleteWallet } from "@/services/wallet.service";
import { WalletType } from "@/types/wallet";
import { WALLET_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface EditWalletDialogProps {
    wallet: {
        _id: string;
        name: string;
        type: string;
        owner: string;
        initialBalance: number;
        color?: string;
        liabilityDetails?: {
            startDate?: string;
            tenorMonths?: number;
        };
        bankDetails?: {
            bankName?: string;
            accountNumber?: string;
            accountHolder?: string;
        };
    };
}

export function EditWalletDialog({ wallet }: EditWalletDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Local state for conditional rendering logic
  const [selectedType, setSelectedType] = useState(wallet.type);
  const [selectedColor, setSelectedColor] = useState(wallet.color || "BLUE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setIsPending(true);

      const formData = new FormData(e.currentTarget);
      const payload: any = {
        name: formData.get("name"),
        type: formData.get("type"),
        initialBalance: Number(formData.get("initialBalance")?.toString().replace(/\D/g, "") || "0"),
        color: formData.get("color"),
      };

      if (payload.type === WalletType.BANK) {
        payload.bankDetails = {
          bankName: formData.get("bankName"),
          accountNumber: formData.get("accountNumber"),
          accountHolder: formData.get("accountHolder"),
        };
      }

      if (payload.type === WalletType.LIABILITY) {
        payload.liabilityDetails = {
          startDate: formData.get("liabilityStartDate"),
          tenorMonths: Number(formData.get("liabilityTenor")),
        };
      }

      try {
          await updateWallet(wallet._id, payload);
          toast.success("Wallet updated successfully");
          setOpen(false);
          window.location.reload(); // Refresh the page to reflect changes
      } catch (error: any) {
          toast.error(error.message || "Failed to update wallet");
      } finally {
          setIsPending(false);
      }
  }

  return (
    <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit Wallet"
        description="Update wallet details."
        trigger={
            <Button variant="secondary" size="icon" className="bg-white/10 hover:bg-white/20 text-white border-0">
                 <Pencil className="w-4 h-4" />
            </Button>
        }
    >
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={wallet.name} required />
          </div>
          
          <div className="grid gap-2">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={wallet.type} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(WalletType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

          </div>

          <div className="grid gap-2">
            <Label htmlFor="initialBalance">Initial Balance</Label>
            <MoneyInput 
                id="initialBalance" 
                name="initialBalance" 
                defaultValue={wallet.initialBalance} 
                required 
            />
             <p className="text-[10px] text-muted-foreground">Adjusting this will affect current balance.</p>
          </div>

          <div className="grid gap-2">
                <Label>Color Theme</Label>
                <input type="hidden" name="color" value={selectedColor} />
                <div className="flex flex-wrap gap-3 mt-1">
                    {WALLET_COLORS.map((c) => (
                            <div 
                            key={c.key}
                            onClick={() => setSelectedColor(c.key)}
                            className={cn(
                                "w-8 h-8 rounded-full cursor-pointer bg-gradient-to-br flex items-center justify-center transition-all hover:scale-110",
                                c.gradient,
                                selectedColor === c.key ? `ring-2 ring-offset-2 ring-offset-background ${c.ring}` : "opacity-80 hover:opacity-100"
                            )}
                            >
                            {selectedColor === c.key && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                            </div>
                    ))}
                </div>
          </div>

          {selectedType === WalletType.BANK && (
              <div className="grid gap-2 border-t pt-4 mt-2">
                 <Label>Bank Details (Optional)</Label>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                         <Label htmlFor="bankName" className="text-xs">Bank Name</Label>
                         <Input id="bankName" name="bankName" defaultValue={wallet.bankDetails?.bankName} placeholder="e.g. BCA" />
                     </div>
                     <div className="grid gap-2">
                         <Label htmlFor="accountHolder" className="text-xs">Holder Name</Label>
                         <Input id="accountHolder" name="accountHolder" defaultValue={wallet.bankDetails?.accountHolder} placeholder="Name" />
                     </div>
                 </div>
                 <div className="grid gap-2">
                      <Label htmlFor="accountNumber" className="text-xs">Account Number</Label>
                      <Input id="accountNumber" name="accountNumber" defaultValue={wallet.bankDetails?.accountNumber} placeholder="1234567890" />
                 </div>
              </div>
          )}

          {selectedType === WalletType.LIABILITY && (
               <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                   <div className="grid gap-2">
                        <Label htmlFor="liabilityStartDate">Start Date</Label>
                        <Input 
                            id="liabilityStartDate" 
                            name="liabilityStartDate" 
                            type="date" 
                            defaultValue={wallet.liabilityDetails?.startDate ? new Date(wallet.liabilityDetails.startDate).toISOString().split('T')[0] : ''}
                        />
                   </div>
                   <div className="grid gap-2">
                        <Label htmlFor="liabilityTenor">Tenor (Months)</Label>
                        <Input 
                            id="liabilityTenor" 
                            name="liabilityTenor" 
                            type="number" 
                            defaultValue={wallet.liabilityDetails?.tenorMonths}
                        />
                   </div>
               </div>
          )}

          <DialogFooter className="sm:justify-between gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">Delete Wallet</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this wallet and remove its data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                       try {
                           await deleteWallet(wallet._id);
                           toast.success("Wallet deleted successfully");
                           setOpen(false);
                           // Force redirect to home if we are on the wallet page, or refresh if on dashboard
                           window.location.href = "/"; 
                       } catch (error: any) {
                           toast.error(error.message || "Failed to delete wallet");
                       }
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>

        </form>
    </ResponsiveDialog>
  );
}
