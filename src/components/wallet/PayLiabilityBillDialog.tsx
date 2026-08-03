"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CreditCard, Loader2 } from "lucide-react";
import { createTransaction } from "@/services/transaction.service";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  sourceWallet: z.string().min(1, "Source wallet is required"),
  date: z.string().default(""),
  description: z.string().optional(),
});

interface PayLiabilityBillDialogProps {
  liabilityWallet: any;
  allWallets: any[];
}

export function PayLiabilityBillDialog({ liabilityWallet, allWallets }: PayLiabilityBillDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Filter out liability and investment wallets from source
  const sourceWallets = allWallets.filter(w => 
      w.type !== "LIABILITY" && w.type !== "INVESTMENT" && w._id !== liabilityWallet._id
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      sourceWallet: sourceWallets.length > 0 ? sourceWallets[0]._id : "",
      date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
      description: `Pembayaran Tagihan ${liabilityWallet.name}`,
    },
  });

  const onOpenChange = (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen) {
          form.reset({
              amount: "",
              sourceWallet: sourceWallets.length > 0 ? sourceWallets[0]._id : "",
              date: new Date().toISOString().slice(0, 16),
              description: `Pembayaran Tagihan ${liabilityWallet.name}`,
          });
      }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const payload = {
      type: "TRANSFER",
      amount: Number(values.amount.replace(/\D/g, "") || "0"),
      wallet: values.sourceWallet,
      targetWallet: liabilityWallet._id,
      date: new Date(values.date).toISOString(),
      description: values.description || `Pembayaran Tagihan ${liabilityWallet.name}`,
    };

    try {
      await createTransaction(payload);
      toast.success("Tagihan berhasil dibayar!");
      setOpen(false);
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["wallets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to pay bill");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Bayar Tagihan"
      description={`Transfer saldo dari wallet lain untuk melunasi tagihan ${liabilityWallet.name}.`}
      trigger={
        <Button variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
          <CreditCard className="w-4 h-4" />
          <span>Bayar Tagihan</span>
        </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nominal Pembayaran</FormLabel>
                <FormControl>
                  <MoneyInput placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground mt-1">
                  Tagihan saat ini: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Math.abs(liabilityWallet.currentBalance || 0))}
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sourceWallet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bayar Dari (Sumber Dana)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih wallet sumber" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sourceWallets.length === 0 && (
                      <SelectItem value="none" disabled>
                        Tidak ada wallet tersedia
                      </SelectItem>
                    )}
                    {sourceWallets.map((w) => (
                      <SelectItem key={w._id} value={w._id}>
                        {w.name} ({new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(w.currentBalance || 0)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan (Opsional)</FormLabel>
                <FormControl>
                  <Input placeholder="Pembayaran Tagihan..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bayar
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
