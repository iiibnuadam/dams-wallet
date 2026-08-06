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

import { parseText, createTransaction } from "@/services/transaction.service";
import Tesseract from "tesseract.js";
import { useUpdateTransaction } from "@/hooks/useTransactions";
import { CategoryService } from "@/services/category.service";
import { Plus, Loader2, Camera } from "lucide-react";
import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { BulkTransactionReview } from "./BulkTransactionReview";

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

// The subset of a populated transaction needed to prefill the edit form.
// Presence of this prop is what puts the dialog into edit mode.
interface EditableTransaction {
    _id: string;
    amount: number;
    description?: string;
    type: string;
    wallet: { _id: string; name: string };
    targetWallet?: { _id: string; name: string };
    category?: { _id: string; name: string };
    date: string;
    adminFee?: number;
}

interface AddTransactionDialogProps {
    wallets: WalletOption[];
    defaultWalletId?: string;
    trigger?: React.ReactNode;
    defaultGoalItemId?: string;
    defaultDescription?: string;
    onSuccess?: () => void;
    successBehavior?: 'reload' | 'refresh';
    // Edit mode: pass the transaction to edit, plus controlled open state
    // (no default trigger button is rendered in this mode).
    transaction?: EditableTransaction;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}


export function AddTransactionDialog({ wallets, defaultWalletId, trigger, defaultGoalItemId, defaultDescription, onSuccess, successBehavior = 'reload', transaction, open: controlledOpen, onOpenChange: onOpenChangeProp }: AddTransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) {
      onOpenChangeProp?.(v);
    } else {
      setInternalOpen(v);
    }
  };
  const [activeTab, setActiveTab] = useState<string>(ClientTransactionType.EXPENSE);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const router = useRouter();
  const updateMutation = useUpdateTransaction();

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
  
  // Never lock the wallet field while editing -- fixing a wrong wallet is
  // exactly the kind of correction Edit exists for, including from a
  // /wallets/[id] page where effectiveDefaultWalletId would otherwise lock it.
  const isLocked = !transaction && !!effectiveDefaultWalletId;

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

  // Sync wallet selection with URL params or props when dialog opens
  // (skipped in edit mode -- the prefill effect below owns the wallet field then).
  useEffect(() => {
      if (open) {
           if (transaction) return;
           const targetWalletId = defaultWalletId || (params?.id as string);
           // Only set if we have a target and it exists in our list
           if (targetWalletId && Array.isArray(wallets)) {
                const isValidWallet = wallets.some(w => w._id === targetWalletId);
                if (isValidWallet) {
                     form.setValue("wallet", targetWalletId);
                     return
                }
           }
           form.setValue("wallet", "");
      }
  }, [open, params?.id, defaultWalletId, wallets, form, transaction]);

  // Prefill the form when editing an existing transaction.
  useEffect(() => {
      if (open && transaction) {
          setActiveTab(transaction.type);
          form.reset({
              amount: String(transaction.amount),
              description: transaction.description || "",
              type: transaction.type as ClientTransactionType,
              category: transaction.category?._id || "",
              wallet: transaction.wallet._id,
              targetWallet: transaction.targetWallet?._id || "",
              adminFee: transaction.adminFee || 0,
              date: new Date(transaction.date).toISOString().split('T')[0],
          });
      }
  }, [open, transaction, form]);

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
      CategoryService.getCategories().then(setCategories).catch(console.error);
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

  const normalizeImage = (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
          // If it's already a standard web format and small enough, we could skip, 
          // but converting guarantees a clean JPEG signature for OCR.space.
          const img = new Image();
          const objectUrl = URL.createObjectURL(file);
          img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                  return resolve(file); // fallback to original
              }
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(
                  (blob) => {
                      if (blob) {
                          const newFile = new File([blob], "image.jpg", {
                              type: "image/jpeg",
                              lastModified: Date.now(),
                          });
                          resolve(newFile);
                      } else {
                          resolve(file); // fallback
                      }
                  },
                  "image/jpeg",
                  0.8 // 80% quality to reduce size
              );
          };
          img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve(file); // fallback
          };
          img.src = objectUrl;
      });
  };

  const [bulkItems, setBulkItems] = useState<any[] | null>(null);

  const handleFile = async (rawFile: File) => {
      setIsUploading(true);
      const toastId = toast.loading("Loading OCR Engine... (might take a few seconds on first run)");
      
      try {
          const file = await normalizeImage(rawFile);
          
          toast.loading("Scanning text from image...", { id: toastId });
          const { data: { text } } = await Tesseract.recognize(
              file,
              'eng',
              { logger: m => console.log(m) }
          );

          if (!text || text.trim() === "") {
              throw new Error("No text found in the image. Please try a clearer picture.");
          }

          toast.loading("AI is analyzing the text...", { id: toastId });
          const results = await parseText(text);
          
          if (!Array.isArray(results) || results.length === 0) {
              throw new Error("AI could not extract any transactions.");
          }

          if (results.length > 1) {
              setBulkItems(results);
              toast.success(`Found ${results.length} transactions!`, { id: toastId });
          } else {
              const result = results[0];
              if (result.type) {
                  const upperType = result.type.toUpperCase();
                  if (Object.values(ClientTransactionType).includes(upperType as any)) {
                      onTabChange(upperType);
                  }
              }
              
              if (result.amount) {
                  form.setValue("amount", result.amount.toString());
              }
              if (result.description) {
                  form.setValue("description", result.description);
              }
              if (result.date) {
                  form.setValue("date", result.date);
              }
              
              if (result.categoryName) {
                  const matchedCat = categories.find(c => 
                      c.name.toLowerCase() === result.categoryName.toLowerCase() && 
                      c.type.toUpperCase() === (result.type || activeTab).toUpperCase()
                  );
                  if (matchedCat) {
                      form.setValue("category", matchedCat.id);
                  }
              }
              
              if (result.walletName && !isLocked) {
                  const matchedWallet = wallets.find(w => w.name.toLowerCase() === result.walletName.toLowerCase());
                  if (matchedWallet) {
                      form.setValue("wallet", matchedWallet._id);
                  }
              }

              toast.success("Details extracted successfully", { id: toastId });
          }
      } catch (error: any) {
          console.error("Failed to parse image", error);
          toast.error("Failed to extract details from image", { id: toastId });
      } finally {
          setIsUploading(false);
          // reset input so same file can be selected again
          if (fileInputRef.current) {
              fileInputRef.current.value = "";
          }
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleFile(file);
  };

  useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
          if (!open) return; // only listen if dialog is open
          const items = e.clipboardData?.items;
          if (!items) return;
          for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf("image") !== -1) {
                  const file = items[i].getAsFile();
                  if (file) {
                      handleFile(file);
                      break;
                  }
              }
          }
      };
      
      window.addEventListener("paste", handlePaste as any);
      return () => {
          window.removeEventListener("paste", handlePaste as any);
      };
  }, [open, activeTab, categories, wallets, isLocked]); // Add dependencies since handleFile uses them

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payload: any = {
        amount: Number(values.amount),
        description: values.description || "",
        type: values.type,
        wallet: values.wallet,
        date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
    };
    
    if (values.category) payload.category = values.category;
    if (!transaction && defaultGoalItemId) payload.goalItem = defaultGoalItemId;

    if (values.type === ClientTransactionType.TRANSFER) {
        if (values.targetWallet) {
            payload.targetWallet = values.targetWallet;
        } else {
            form.setError("targetWallet", { message: "Target wallet required" });
            return;
        }
        if (values.adminFee) {
            payload.adminFee = values.adminFee;
        }
    }

    try {
        if (transaction) {
            await updateMutation.mutateAsync({ id: transaction._id, ...payload });
            setOpen(false);
            toast.success("Transaction updated");
            onSuccess?.();
            return;
        }

        await createTransaction(payload);

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
        if (onSuccess) {
            onSuccess();
        } else if (successBehavior === 'refresh') {
            window.dispatchEvent(new CustomEvent('transaction-added'));
            router.refresh();
        } else {
            window.location.reload();
        }
    } catch (error: any) {
        console.error(error);
        toast.error(error.message || (transaction ? "Failed to update transaction" : "Failed to add transaction"));
    }
  }

  return (
    <ResponsiveDialog
        open={open}
        onOpenChange={(val) => {
            if (!val) setBulkItems(null);
            setOpen(val);
        }}
        title={transaction ? "Edit Transaction" : (bulkItems ? "Bulk Review" : "Add Transaction")}
        description={transaction ? "Update the details of this transaction." : (bulkItems ? "Review the scanned transactions." : "Record your income, expense, or transfer.")}
        trigger={transaction ? null : (trigger ? trigger : (
            <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Add Transaction
            </Button>
        ))}
    >
        {bulkItems ? (
            <BulkTransactionReview 
                items={bulkItems} 
                categories={categories} 
                wallets={wallets} 
                defaultWalletId={effectiveDefaultWalletId || (wallets.length > 0 ? wallets[0]._id : "")}
                onSuccess={() => {
                    setBulkItems(null);
                    setOpen(false);
                    if (onSuccess) {
                        onSuccess();
                    } else if (successBehavior === 'refresh') {
                        window.dispatchEvent(new CustomEvent('transaction-added'));
                        router.refresh();
                    } else {
                        window.location.reload();
                    }
                }}
                onCancel={() => setBulkItems(null)}
            />
        ) : (
            <>
                <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value={ClientTransactionType.EXPENSE}>Expense</TabsTrigger>
                <TabsTrigger value={ClientTransactionType.INCOME}>Income</TabsTrigger>
                <TabsTrigger value={ClientTransactionType.TRANSFER}>Transfer</TabsTrigger>
            </TabsList>
        </Tabs>

        {!transaction && (
            <div className="flex flex-col mt-4">
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-dashed" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                    Scan Receipt (or Paste Image)
                </Button>
            </div>
        )}

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
                 <FormItem className="flex flex-col">
                  <FormLabel>Category</FormLabel>
                   <FormControl>
                        <CategoryCombobox
                            categories={filteredCategories}
                            value={field.value}
                            onChange={field.onChange}
                            modal
                        />
                   </FormControl>
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
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
                {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                    </>
                ) : (
                    transaction ? "Update Transaction" : "Save Transaction"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </>
    )}
    </ResponsiveDialog>
  );
}
