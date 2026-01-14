"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Pencil, Plus, Trash2, Check } from "lucide-react";
import { updateGroupStyleAction, deleteGoalGroupAction, updateGoalGroupAction, addGoalGroupAction } from "@/actions/goal";

// ... (previous code)


import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { SAFE_COLORS, PRESET_ICONS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentGroupId: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// Reusable Icon Picker Component
const IconPickerField = ({ form }: { form: any }) => {
    const currentValue = form.watch("icon");
    const isCustom = !PRESET_ICONS.includes(currentValue) && currentValue !== "" && currentValue !== undefined;
    const [showCustom, setShowCustom] = useState(isCustom);

    return (
        <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
                <FormItem className="flex-1">
                    <FormLabel>Icon</FormLabel>
                    <div className="space-y-3 mt-2">
                        {/* Preset Icons Grid */}
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_ICONS.slice(0, 10).map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => {
                                        field.onChange(icon);
                                        setShowCustom(false);
                                    }}
                                    className={cn(
                                        "text-xl p-2 rounded-md transition-all border",
                                        field.value === icon 
                                            ? "bg-primary/10 border-primary shadow-sm scale-110" 
                                            : "bg-transparent border-transparent hover:bg-muted"
                                    )}
                                >
                                    {icon}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustom(true);
                                    if (!isCustom) field.onChange(""); // Clear if switching to custom
                                }}
                                className={cn(
                                    "text-sm px-3 rounded-md transition-all border flex items-center bg-muted/30 hover:bg-muted",
                                    showCustom ? "border-primary ring-1 ring-primary" : "border-transparent"
                                )}
                            >
                                Other
                            </button>
                        </div>

                        {/* Custom Input */}
                        {showCustom && (
                             <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <Input 
                                    placeholder="Type any emoji or text..." 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value)}
                                    className="text-center text-lg"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                                    Tip: Press <kbd className="px-1 bg-muted rounded">Win</kbd> + <kbd className="px-1 bg-muted rounded">.</kbd> or <kbd className="px-1 bg-muted rounded">Cmd</kbd> + <kbd className="px-1 bg-muted rounded">Ctrl</kbd> + <kbd className="px-1 bg-muted rounded">Space</kbd> for emojis
                                </p>
                            </div>
                        )}
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

interface EditGroupDialogProps {
    goalId: string;
    group: {
        _id?: string;
        name: string;
        color?: string;
        icon?: string;
        parentGroupId?: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingGroups?: any[];
    trigger?: React.ReactNode;
}

export function EditGroupDialog({ goalId, group, existingGroups, trigger }: EditGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: group.name,
            icon: group.icon || "",
            color: group.color || "",
            parentGroupId: group.parentGroupId || "root"
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const formData = new FormData();
            formData.append("name", values.name);
            if (values.color) formData.append("color", values.color);
            if (values.icon) formData.append("icon", values.icon);
            if (values.parentGroupId && values.parentGroupId !== "root") {
                formData.append("parentGroupId", values.parentGroupId);
            } else {
                 // Explicitly unset parent if root
                 formData.append("parentGroupId", "");
            }

            await updateGoalGroupAction(goalId, group._id!, formData);
            
            toast.success("Group updated");
            queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
            setOpen(false);
        } catch (error) {
            toast.error("Failed to update group");
        }
    }

    async function onDelete() {
         try {
            await deleteGoalGroupAction(goalId, group._id!);
            toast.success("Group deleted");
            queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
            setOpen(false);
        } catch (error) {
            toast.error("Failed to delete group");
        }
    }

    // Filter out the current group from existingGroups to prevent circular dependency
    const availableParents = existingGroups?.filter(g => g._id !== group._id) || [];

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title="Edit Group"
            description="Manage your budget group."
            trigger={trigger || (
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover/header:opacity-100 transition-opacity">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
            )}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Group Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Needs, Wants, Savings" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                     <div className="flex gap-4">
                        <IconPickerField form={form} />

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted/20 rounded-lg max-h-[120px] overflow-y-auto">
                                        {SAFE_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => field.onChange(color)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full transition-all relative flex items-center justify-center",
                                                    field.value === color ? "ring-2 ring-primary scale-110" : "hover:scale-110"
                                                )}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            >
                                                {field.value === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                                            </button>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="parentGroupId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent Group (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="None (Top Level)" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="root">None (Top Level)</SelectItem>
                                        {availableParents.map((g) => (
                                            <SelectItem key={g._id} value={g._id}>
                                                {g.icon} {g.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-between gap-2 pt-2">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" size="icon">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the group and all its items.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        
                        <Button type="submit" className="flex-1">Save Changes</Button>
                    </div>
                </form>
            </Form>
        </ResponsiveDialog>
    );
}

interface AddGroupDialogProps {
    goalId: string;
    parentGroupId?: string; // Optional parent group ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingGroups?: any[];
    trigger?: React.ReactNode;
}

export function AddGroupDialog({ goalId, parentGroupId, existingGroups, trigger }: AddGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            icon: "📁",
            color: "#6366f1",
            parentGroupId: parentGroupId || "root"
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const formData = new FormData();
            formData.append("name", values.name);
            if (values.color) formData.append("color", values.color);
            if (values.icon) formData.append("icon", values.icon);
            if (values.parentGroupId && values.parentGroupId !== "root") {
                formData.append("parentGroupId", values.parentGroupId);
            }

            await addGoalGroupAction(goalId, formData);
            
            toast.success("Group created");
            queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
            setOpen(false);
            form.reset();
        } catch (error) {
             console.error(error);
             toast.error("Failed to create group");
        }
    }

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title="Create New Group"
            description="Add a group to organize your budget."
            trigger={trigger || (
                <Button size="sm" variant="outline" className="gap-2 h-8">
                    <Plus className="w-3.5 h-3.5" /> New Group
                </Button>
            )}
        >
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Group Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Needs, Wants, Savings" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                     <div className="flex gap-4">
                        <IconPickerField form={form} />

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted/20 rounded-lg max-h-[120px] overflow-y-auto">
                                        {SAFE_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => field.onChange(color)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full transition-all relative flex items-center justify-center",
                                                    field.value === color ? "ring-2 ring-primary scale-110" : "hover:scale-110"
                                                )}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            >
                                                {field.value === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                                            </button>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="parentGroupId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent Group (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="None (Top Level)" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="root">None (Top Level)</SelectItem>
                                        {existingGroups?.filter(g => g._id !== "new").map((g: any) => (
                                            <SelectItem key={g._id} value={g._id}>
                                                {g.icon} {g.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full">Create Group</Button>
                </form>
            </Form>
        </ResponsiveDialog>
    );
}
