"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
import { getCategoriesAction } from "@/actions/category-actions";
import { TransactionType, PaymentPhase } from "@/types/transaction";
import { toast } from "sonner";
import { Banknote } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { updateGoalItemCompletionAction } from "@/actions/goal";
import { useCreateTransaction } from "@/hooks/useTransactions";

const formSchema = z.object({
  amount: z.coerce.number().min(1, "Amount is required"),
  wallet: z.string().min(1, "Wallet is required"),
  date: z.string().min(1, "Date is required"),
  paymentPhase: z.nativeEnum(PaymentPhase),
  note: z.string().optional(),
  markAsCompleted: z.boolean().default(false),
});

interface PayGoalItemDialogProps {
    goalId?: string;
    goalName?: string;
    item: { _id: string; name: string };
    wallets: any[];
    trigger?: React.ReactNode;
}

export function PayGoalItemDialog({ goalName, item, wallets, trigger }: PayGoalItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Use mutation hook
    const { mutateAsync: createTx } = useCreateTransaction();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 0,
            wallet: wallets.length > 0 ? wallets[0]._id : "",
            date: new Date().toISOString().split('T')[0],
            paymentPhase: PaymentPhase.DP, 
            note: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);

        try {
            // 1. Resolve Category
            const categories = await getCategoriesAction();
            let targetCategory = categories.find((c: any) => c.name === goalName && c.type === TransactionType.EXPENSE);
            
            if (!targetCategory) {
                targetCategory = categories.find((c: any) => 
                    (c.name.toLowerCase().includes("goal") || c.name.toLowerCase().includes("tabungan")) 
                    && c.type === TransactionType.EXPENSE
                );
            }

            // 2. Construct Data
            const formData = new FormData();
            formData.append("amount", values.amount.toString());
            
            // Format Description: "Payment for [Item] ([Phase])" or custom Note
            const desc = values.note || `Payment for ${item.name} (${values.paymentPhase})`;
            formData.append("description", desc);
            
            formData.append("type", TransactionType.EXPENSE);
            formData.append("wallet", values.wallet);
            formData.append("date", values.date);
            if (targetCategory) {
                formData.append("category", targetCategory.id);
            }
            formData.append("goalItem", item._id);
            formData.append("paymentPhase", values.paymentPhase);

            const result = await createTx(formData);

            if (result.success) {
                if (values.markAsCompleted) {
                    await updateGoalItemCompletionAction(item._id, true);
                }
                
                toast.success("Payment recorded successfully!");
                setOpen(false);
                form.reset();
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title={`Pay for ${item.name}`}
            description={`Record a payment for this goal item. Category will be set to "${goalName || 'Financial Goals'}" if available.`}
            trigger={trigger || <Button size="sm" variant="outline"><Banknote className="w-4 h-4 mr-2" /> Pay</Button>}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <MoneyInput 
                                        placeholder="0"
                                        value={field.value as number}
                                        onValueChange={field.onChange}
                                    />
                                </FormControl>
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

                    <div className="grid grid-cols-2 gap-4">
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

                        <FormField
                            control={form.control}
                            name="paymentPhase"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phase</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select phase" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(PaymentPhase).map((phase) => (
                                                <SelectItem key={phase} value={phase}>
                                                    {phase}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Note (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder={`Payment for ${item.name}...`} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="markAsCompleted"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Mark as Fully Paid (Lunas)
                                    </FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Check this if you got a lower price or want to close this item despite paying less than estimated.
                                    </p>
                                </div>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Recording..." : "Save Payment"}
                    </Button>
                </form>
            </Form>
        </ResponsiveDialog>
    );
}
