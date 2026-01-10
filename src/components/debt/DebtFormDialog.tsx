"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { Plus, Loader2, Upload, FileText, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { useCreateDebt, useUpdateDebt } from "@/hooks/useDebts";

const formSchema = z.object({
  type: z.enum(["LENT", "BORROWED"]),
  person: z.string().min(1, "Person name is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  loanDate: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  proofUrl: z.string().optional(),
});

interface DebtFormDialogProps {
  debt?: any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: () => void;
}

export function DebtFormDialog({ debt, trigger, open: controlledOpen, onOpenChange, onSaved }: DebtFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: createDebt } = useCreateDebt();
  const { mutateAsync: updateDebt } = useUpdateDebt();

  const isControlled = typeof controlledOpen !== "undefined";
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: debt?.type || "LENT",
      person: debt?.person || "",
      amount: debt?.amount?.toString() || "",
      description: debt?.description || "",
      loanDate: debt?.loanDate ? new Date(debt.loanDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: debt?.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : "",
      notes: debt?.notes || "",
      proofUrl: debt?.proofUrl || "",
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      setUploading(true);
      
      try {
          const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
          });
          form.setValue("proofUrl", newBlob.url);
      } catch (error) {
          console.error("Upload failed:", error);
          alert("Upload failed. Please check your connection or credentials.");
      } finally {
          setUploading(false);
      }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    
    const payload = {
        type: values.type,
        person: values.person,
        amount: Number(values.amount),
        description: values.description,
        loanDate: new Date(values.loanDate),
        dueDate: values.dueDate ? new Date(values.dueDate) : undefined,
        notes: values.notes,
        proofUrl: values.proofUrl,
    };

    try {
        let res;
        if (debt) {
            res = await updateDebt({ id: debt._id, data: payload });
        } else {
            res = await createDebt(payload);
        }

        setLoading(false);

        if (res.success) {
            setOpen(false);
            form.reset();
            if (onSaved) onSaved();
        } else {
            alert(res.message || "Failed to save record");
        }
    } catch (error: any) {
        setLoading(false);
        alert(error.message || "Failed");
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={debt ? "Edit Record" : "New Debt/Receivable"}
      description="Track money you owe or is owed to you."
      trigger={trigger || (
          <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Record
          </Button>
      )}
      footer={
          <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={loading || uploading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {debt ? "Save Changes" : "Save Record"}
          </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 px-1">
            
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
                            <SelectItem value="LENT">I Lent (Piutang)</SelectItem>
                            <SelectItem value="BORROWED">I Borrowed (Utang)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="person"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{form.watch("type") === "LENT" ? "Who owes you?" : "Who do you owe?"}</FormLabel>
                    <FormControl>
                    <Input placeholder="Person Name" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g. Lunch money, Loan for X" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="loanDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Loan Date</FormLabel>
                        <FormControl>
                        <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                 <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Due Date (Optional)</FormLabel>
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
                    name="proofUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Proof (Optional)</FormLabel>
                        <FormControl>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept="image/*,application/pdf"
                                />
                                {field.value ? (
                                    <div className="flex items-center gap-2 text-sm border p-2 rounded w-full justify-between bg-zinc-50 dark:bg-zinc-800">
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            <span className="truncate max-w-[150px] text-xs">Proof Attached</span>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 w-6 p-0"
                                            onClick={() => form.setValue("proofUrl", "")}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="w-full gap-2 text-muted-foreground font-normal"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4" />
                                        )}
                                        {uploading ? "Uploading..." : "Upload Receipt/Proof"}
                                    </Button>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            
            <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                    <Textarea placeholder="Additional details..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <DialogFooter className="hidden md:flex">
                <Button type="submit" disabled={loading || uploading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {debt ? "Save Changes" : "Save Record"}
                </Button>
            </DialogFooter>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
