"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WalletType } from "@/types/wallet";
import { createWallet } from "@/actions/wallet";
import { Plus, Check } from "lucide-react";
import { WALLET_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Enums must be mirrored if not using the enum directly conveniently in Zod schema above in client component
// But we imported them, so it's fine.

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  initialBalance: z.string().default("0"),
  color: z.string().default("BLUE"),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
});

export function AddWalletDialog() {
  const [open, setOpen] = useState(false);
  
  // Explicitly define the form values type to match schema
  const form = useForm<z.infer<typeof formSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      // Select value is managed but using undefined as default for required field works in React Hook Form
      type: undefined,
      initialBalance: "0",
      color: "BLUE",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("type", values.type);
    formData.append("initialBalance", values.initialBalance);
    formData.append("color", values.color);
    if(values.bankName) formData.append("bankName", values.bankName);
    if(values.accountNumber) formData.append("accountNumber", values.accountNumber);
    if(values.accountHolder) formData.append("accountHolder", values.accountHolder);

    const result = await createWallet(null, formData);

    if (result.success) {
      setOpen(false);
      form.reset();
    } else {
        // Handle error (toast usually)
        alert(result.message);
    }
  }

  return (
    <ResponsiveDialog 
        open={open}
        onOpenChange={setOpen}
        title="Add New Wallet"
        description="Create a new wallet to track your finances."
        trigger={
            <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Wallet
            </Button>
        }
    >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. BCA Primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {Object.values(WalletType).map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === WalletType.BANK && (
                 <div className="grid grid-cols-1 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                     <p className="text-sm font-semibold text-muted-foreground mb-2">Bank Details (Optional)</p>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-xs">Bank Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. BCA" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="accountHolder"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-xs">Holder Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                    
                     <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs">Account Number</FormLabel>
                            <FormControl>
                                <Input placeholder="1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
            )}


             <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Balance</FormLabel>
                  <FormControl>
                    <MoneyInput value={field.value} onValueChange={field.onChange} placeholder="0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Theme</FormLabel>
                  <FormControl>
                     <div className="flex flex-wrap gap-3 mt-2">
                        {WALLET_COLORS.map((c) => (
                             <div 
                                key={c.key}
                                onClick={() => field.onChange(c.key)}
                                className={cn(
                                    "w-8 h-8 rounded-full cursor-pointer bg-gradient-to-br flex items-center justify-center transition-all hover:scale-110",
                                    c.gradient,
                                    field.value === c.key ? `ring-2 ring-offset-2 ring-offset-background ${c.ring}` : "opacity-80 hover:opacity-100"
                                )}
                             >
                                {field.value === c.key && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                             </div>
                        ))}
                     </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Create Wallet</Button>
            </DialogFooter>
          </form>
        </Form>
    </ResponsiveDialog>
  );
}
