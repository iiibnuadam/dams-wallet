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
import { useCreateGoalItem, useUpdateGoalItem } from "@/hooks/useGoals";

const formSchema = z.object({
  groupId: z.string().optional(),
  groupName: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  estimatedAmount: z.coerce.number().min(0, "Amount must be positive"),
}).refine(data => data.groupId || data.groupName, {
    message: "Group is required (select existing or create new)",
    path: ["groupName"]
});

interface GoalGroup {
    _id: string;
    name: string;
    parentGroupId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children?: any[];
}

interface GoalItemFormProps {
    goalId: string;
    itemId?: string; // If present, it's an edit
    existingGroups?: GoalGroup[];
    defaultValues?: Partial<z.infer<typeof formSchema>>;
    onSuccess?: () => void;
}

export function GoalItemForm({ goalId, itemId, existingGroups = [], defaultValues, onSuccess }: GoalItemFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const { mutateAsync: createItem } = useCreateGoalItem();
    const { mutateAsync: updateItem } = useUpdateGoalItem();

    // Determine initial values
    const initialGroupId = defaultValues?.groupId;
    // If we have a groupId, find the name. If not, use the provided groupName (legacy or new custom)
    const initialGroupName = initialGroupId 
        ? existingGroups.find(g => g._id === initialGroupId)?.name 
        : defaultValues?.groupName || "";

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            groupId: initialGroupId,
            groupName: initialGroupName,
            name: defaultValues?.name || "",
            estimatedAmount: defaultValues?.estimatedAmount || 0,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        const formData = new FormData();
        formData.append("goalId", goalId);
        
        if (values.groupId) {
             formData.append("groupId", values.groupId);
        } else if (values.groupName) {
             formData.append("groupName", values.groupName);
        }

        formData.append("name", values.name);
        formData.append("estimatedAmount", values.estimatedAmount.toString());

        try {
            const result = itemId
                ? await updateItem({ id: itemId, goalId, formData })
                : await createItem(formData);
            
            setLoading(false);

            if (result.success) {
                toast.success(result.message);
                if (onSuccess) onSuccess();
                form.reset();
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            setLoading(false);
            toast.error(error.message || "Something went wrong");
        }
    }

    // Helper to find group name by ID or use custom name
    const currentGroupId = form.watch("groupId");
    const currentCustomName = form.watch("groupName");
    
    // Build Hierarchical Names
    const groupMap = new Map<string, GoalGroup>();
    existingGroups.forEach(g => groupMap.set(g._id, g));

    const getGroupName = (group: GoalGroup): string => {
        if (group.parentGroupId && groupMap.has(group.parentGroupId)) {
            const parent = groupMap.get(group.parentGroupId)!;
            // Recursive check? For now assuming 1-2 levels, but let's be safe
            // To avoid potential infinite loops if circular (shouldn't happen), simple one-level up check or just full recursion
            return `${getGroupName(parent)} > ${group.name}`;
        }
        return group.name;
    };

    const sortedGroups = [...existingGroups].map(g => ({
        ...g,
        fullName: getGroupName(g)
    })).sort((a, b) => a.fullName.localeCompare(b.fullName));

    // Display logic
    const selectedGroup = sortedGroups.find(g => g._id === currentGroupId);
    const displayValue = selectedGroup ? selectedGroup.fullName : currentCustomName;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="groupName" // We bind to groupName for the UI trigger value mostly
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Group</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className={cn(
                                                "w-full justify-between truncate",
                                                !displayValue && "text-muted-foreground"
                                            )}
                                        >
                                            <span className="truncate">{displayValue || "Select or create group..."}</span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command filter={(value, search) => {
                                        if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                                        return 0;
                                    }}>
                                        <CommandInput 
                                            placeholder="Search or create group..." 
                                            value={searchValue}
                                            onValueChange={setSearchValue}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                <div 
                                                    className="py-2 px-4 text-sm cursor-pointer hover:bg-muted font-medium text-emerald-600"
                                                    onClick={() => {
                                                        form.setValue("groupId", undefined); // Clear ID
                                                        form.setValue("groupName", searchValue);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    + Create new "{searchValue}"
                                                </div>
                                            </CommandEmpty>
                                            <CommandGroup heading="Existing Groups">
                                                {sortedGroups.map((group) => (
                                                    <CommandItem
                                                        value={group.fullName} // Search against full name
                                                        key={group._id}
                                                        onSelect={() => {
                                                            form.setValue("groupName", ""); 
                                                            form.setValue("groupId", group._id);
                                                            setOpen(false);
                                                            setSearchValue("");
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                group._id === currentGroupId
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <span className="truncate">{group.fullName}</span>
                                                    </CommandItem>
                                                ))}
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
                                <Input placeholder="e.g. Venue Rental" {...field} />
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
