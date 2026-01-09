"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createGoalItemAction, updateGoalItemAction } from "@/actions/goal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoneyInput } from "@/components/ui/money-input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const formSchema = z.object({
  groupName: z.string().min(1, "Group Name is required"),
  name: z.string().min(1, "Name is required"),
  estimatedAmount: z.coerce.number().min(0, "Amount must be positive"),
});

interface GoalItemFormProps {
    goalId: string;
    itemId?: string; // If present, it's an edit
    existingGroups?: string[];
    defaultValues?: Partial<z.infer<typeof formSchema>>;
    onSuccess?: () => void;
}

export function GoalItemForm({ goalId, itemId, existingGroups = [], defaultValues, onSuccess }: GoalItemFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            groupName: defaultValues?.groupName || "",
            name: defaultValues?.name || "",
            estimatedAmount: defaultValues?.estimatedAmount || 0,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        const formData = new FormData();
        formData.append("goalId", goalId);
        formData.append("groupName", values.groupName);
        formData.append("name", values.name);
        formData.append("estimatedAmount", values.estimatedAmount.toString());

        const result = itemId
            ? await updateGoalItemAction(itemId, goalId, null, formData)
            : await createGoalItemAction(null, formData);
        
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            if (onSuccess) onSuccess();
            form.reset();
            router.refresh();
        } else {
            toast.error(result.message);
        }
    }



    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="groupName"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Group Name</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value
                                                ? field.value
                                                : "Select or type group..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput 
                                            placeholder="Search group..." 
                                            value={searchValue}
                                            onValueChange={setSearchValue}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                <div 
                                                    className="py-2 px-4 text-sm cursor-pointer hover:bg-muted"
                                                    onClick={() => {
                                                        form.setValue("groupName", searchValue);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    Create new "{searchValue}"
                                                </div>
                                            </CommandEmpty>
                                            <CommandGroup heading="Existing Groups">
                                                {existingGroups.map((group) => (
                                                    <CommandItem
                                                        value={group}
                                                        key={group}
                                                        onSelect={() => {
                                                            form.setValue("groupName", group);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                group === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {group}
                                                    </CommandItem>
                                                ))}
                                                {searchValue && !existingGroups.some(g => g.toLowerCase() === searchValue.toLowerCase()) && (
                                                     <CommandItem
                                                        value={searchValue}
                                                        onSelect={() => {
                                                            form.setValue("groupName", searchValue);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                                        Create "{searchValue}"
                                                    </CommandItem>
                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Rental Fee" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="estimatedAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estimated Cost</FormLabel>
                            <FormControl>
                                <MoneyInput 
                                    placeholder="0" 
                                    value={Number(field.value)}
                                    onValueChange={(val) => field.onChange(val)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : (itemId ? "Update Item" : "Add Item")}
                </Button>
            </form>
        </Form>
    );
}
