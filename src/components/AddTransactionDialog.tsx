"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DialogFooter } from "@/components/ui/dialog"; // Footer might still be needed if used explicitly inside form?
// Wait, DialogFooter was inside Form in my replacement? Yes.
// ResponsiveDialog implementation wraps content but not footer logic necessarily if I put footer inside children.
// My implementation of ResponsiveDialog handles wrapping but allows arbitrary children.
// Does ResponsiveDialog export DialogFooter? No.
// But libraries shadecn-ui dialog exports it.
// So I should keep DialogFooter import.
// Remove others.
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { TransactionType } from "@/types/transaction"; 

import { createTransaction } from "@/actions/transaction";
import { getCategoriesAction } from "@/actions/category-actions";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useParams } from "next/navigation";

// Need to match the enum from models or define a local one if type import fails, but best to have shared types.
// I'll assume TransactionType is available in types/transaction or models/Transaction
// Actually, let's redefine valid enum values for client simplicity or import if possible.
enum ClientTransactionType {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE",
    TRANSFER = "TRANSFER"
}

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  type: z.nativeEnum(ClientTransactionType),
  category: z.string().optional(),
  wallet: z.string().min(1, "Wallet is required"),
  targetWallet: z.string().optional(),
  adminFee: z.coerce.number().optional().default(0),
  date: z.string().default(""), // Handled in useEffect
});

interface WalletOption {
    _id: string;
    name: string;
}


interface AddTransactionDialogProps {
    wallets: WalletOption[]; 
    defaultWalletId?: string;
    trigger?: React.ReactNode;
    defaultGoalItemId?: string;
    defaultDescription?: string;
}


export function AddTransactionDialog({ wallets, defaultWalletId, trigger, defaultGoalItemId, defaultDescription }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(ClientTransactionType.EXPENSE);
  const params = useParams();
  
  // Determine if we are in a specific wallet context from URL params if not explicitly passed
  // (Note: params.id might serve other purposes in other routes, so be careful. 
  // But for /wallets/[id], it is the wallet id. AddTransactionDialog is likely used in contexts where if 'id' exists it's a wallet or completely unrelated.
  // Best to only use it if it matches a known wallet ID from the list to be safe? 
  // No, the list might be all wallets.
  // Let's assume if 'id' param exists and defaultWalletId is undefined, we use it.)
  
  const walletIdFromParams = params?.id as string | undefined;
  
  // Preference: 1. explicit prop (defaultWalletId) 2. route param (walletIdFromParams)
  const effectiveDefaultWalletId = defaultWalletId || walletIdFromParams;
  
  // Lock logic: Lock if explicitly passed OR if derived from params (implies we are on a detail page)
  // BUT avoid locking if we just fell back to first wallet in the absence of any context (which we handle in defaultValues below, not here).
  // Wait, layout.tsx previously passed wallets[0]._id if nothing else. We will change layout.tsx to pass undefined.
  
  const isLocked = !!effectiveDefaultWalletId;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      description: defaultDescription || "",
      type: ClientTransactionType.EXPENSE,
      category: "",
      wallet: effectiveDefaultWalletId || (wallets.length > 0 ? wallets[0]._id : ""),
      targetWallet: undefined,
      adminFee: 0,
      date: "", // Initialize empty to avoid hydration mismatch
    },
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
      getCategoriesAction().then(setCategories);
     // Set default date on client side only
     form.setValue("date", new Date().toISOString().split('T')[0]);
  }, []);

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const activeCategory = form.watch("category");
  const activeType = form.watch("type");

  // Auto-fill description when category changes
  useEffect(() => {
     if (activeCategory) {
         const category = categories.find(c => c.id === activeCategory);
         if (category) {
             const currentDesc = form.getValues("description");
             // Overwrite if empty OR if it matches any category name (assuming it was auto-filled)
             const isLikelyAutoFilled = !currentDesc || categories.some(c => c.name === currentDesc);
             
             if (isLikelyAutoFilled) {
                form.setValue("description", category.name);
             }
         }
     }
  }, [activeCategory, categories, form]);

  // Watch type to conditionally validate or show fields (though Zod checks schema)
  // We sync tab change to form value
  const onTabChange = (value: string) => {
      setActiveTab(value);
      form.setValue("type", value as ClientTransactionType);
      form.setValue("type", value as ClientTransactionType);
      form.setValue("description", ""); // Clear description on type change
      form.setValue("category", ""); // Reset category as list changes
      form.setValue("adminFee", 0);
      form.clearErrors(); 
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("amount", values.amount);
    formData.append("description", values.description || "");
    formData.append("type", values.type);
    formData.append("wallet", values.wallet);
    if (values.category) formData.append("category", values.category);
    formData.append("date", values.date);
    if (defaultGoalItemId) {
        formData.append("goalItem", defaultGoalItemId);
    }
    
    if (values.type === ClientTransactionType.TRANSFER) {
        if (values.targetWallet) {
            formData.append("targetWallet", values.targetWallet);
        } else {
            form.setError("targetWallet", { message: "Target wallet required" });
            return;
        }
        if (values.adminFee) {
            formData.append("adminFee", values.adminFee.toString());
        }
    }

    const result = await createTransaction(null, formData);

    if (result.success) {
      setOpen(false);
      form.reset({
          amount: "",
          description: "",
          type: activeTab as ClientTransactionType,
          category: "",
          wallet: defaultWalletId || "",
          targetWallet: "",
          date: new Date().toISOString().split('T')[0],
      });
      toast.success("Transaction added");
    } else {
      console.log(result)
        toast.error(result.message);
    }
  }

  return (
    <ResponsiveDialog 
        open={open} 
        onOpenChange={setOpen}
        title="Add Transaction"
        description="Record your income, expense, or transfer."
        trigger={trigger ? trigger : (
            <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Add Transaction
            </Button>
        )}
    >
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value={ClientTransactionType.EXPENSE}>Expense</TabsTrigger>
                <TabsTrigger value={ClientTransactionType.INCOME}>Income</TabsTrigger>
                <TabsTrigger value={ClientTransactionType.TRANSFER}>Transfer</TabsTrigger>
            </TabsList>
        </Tabs>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            
            <FormField
              control={form.control}
              name="wallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{activeTab === ClientTransactionType.TRANSFER ? "Source Wallet" : "Wallet"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLocked}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {wallets.map((w) => (
                            <SelectItem key={w._id} value={w._id}>
                                {w.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {activeTab === ClientTransactionType.TRANSFER && (
                 <FormField
                 control={form.control}
                 name="targetWallet"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Destination Wallet</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Select destination" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                           {wallets
                                .filter(w => w._id !== form.watch("wallet"))
                                .map((w) => (
                               <SelectItem key={w._id} value={w._id}>
                                   {w.name}
                               </SelectItem>
                           ))}
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />
            )}

            {activeTab === ClientTransactionType.TRANSFER && (
                 <FormField
                  control={form.control}
                  name="adminFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Fee (Biaya Admin)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                             <MoneyInput
                                placeholder="0"
                                value={field.value as number}
                                onValueChange={field.onChange}
                            />
                            <div className="flex gap-2">
                                {[500, 2500, 6500].map(amt => (
                                    <Button 
                                        key={amt} 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs h-7"
                                        onClick={() => field.onChange(amt)}
                                    >
                                        Rp {amt}
                                    </Button>
                                ))}
                            </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {filteredCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                        <MoneyInput
                            placeholder="0"
                            value={field.value}
                            onValueChange={field.onChange}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
    </ResponsiveDialog>
  );
}
