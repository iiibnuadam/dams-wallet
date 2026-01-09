"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { createRoutineAction, updateRoutineAction } from "@/actions/routine"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { Plus, Loader2, Pencil } from "lucide-react";
import { getCategories } from "@/actions/category";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  startDate: z.string(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  wallet: z.string().min(1, "Source wallet is required"),
  targetWallet: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
});

interface RoutineFormDialogProps {
  wallets: any[];
  routine?: any; // If provided, edit mode
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: () => void;
}

export function RoutineFormDialog({ wallets, routine, trigger, open: controlledOpen, onOpenChange, onSaved }: RoutineFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const isControlled = typeof controlledOpen !== "undefined";
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;
  
  useEffect(() => {
    if (open) {
        getCategories().then(setCategories);
    }
  }, [open]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: routine?.description || "",
      amount: routine?.amount?.toString() || "",
      frequency: routine?.frequency || "MONTHLY",
      startDate: routine?.nextRun ? new Date(routine.nextRun).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      type: routine?.type || "EXPENSE",
      wallet: routine?.wallet || "",
      targetWallet: routine?.targetWallet || "",
      category: routine?.category || "",
      status: routine?.status || "ACTIVE",
    },
  });

  // Watch type to conditionally show fields
  const type = form.watch("type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    
    // ... (payload construction) ...

    const payload = {
        description: values.description,
        amount: Number(values.amount),
        frequency: values.frequency,
        startDate: new Date(values.startDate),
        type: values.type,
        wallet: values.wallet,
        targetWallet: values.type === "TRANSFER" ? values.targetWallet : undefined,
        category: values.category || undefined,
        status: values.status || "ACTIVE",
    };

    let res;
    if (routine) {
        res = await updateRoutineAction(routine._id, payload);
    } else {
        res = await createRoutineAction(payload);
    }

    setLoading(false);

    if (res.success) {
      setOpen(false);
      form.reset();
      if (onSaved) onSaved();
    } else {
      alert(res.message || "Failed to save routine");
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={routine ? "Edit Routine" : "Create Routine"}
      description="Setup an automatic billing schedule."
      trigger={trigger || (
          <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> New Routine
          </Button>
      )}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g. Netflix Subscription" {...field} />
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
                            disabled={field.disabled}
                            name={field.name}
                            ref={field.ref}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "ACTIVE"}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PAUSED">Paused</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

             <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{routine ? "Next Run Date" : "Start Date"}</FormLabel>
                    <FormControl>
                    <Input type="date" {...field} />
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
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="TRANSFER">Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            <FormField
                control={form.control}
                name="wallet"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Source Wallet</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                             {wallets.map((w: any) => (
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

            {type === "TRANSFER" && (
                <FormField
                    control={form.control}
                    name="targetWallet"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target Wallet</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select target wallet" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {wallets.filter((w: any) => w._id !== form.watch("wallet")).map((w: any) => (
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
            
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category (Optional)" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                             {categories.filter(c => c.type === form.watch("type")).map((c: any) => (
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

            <DialogFooter>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {routine ? "Save Changes" : "Create Routine"}
                </Button>
            </DialogFooter>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
