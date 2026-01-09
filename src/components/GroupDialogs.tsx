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
import { Pencil, Palette } from "lucide-react";
import { updateGroupStyleAction } from "@/actions/goal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { SAFE_COLORS, PRESET_ICONS } from "@/lib/constants";

const formSchema = z.object({
  color: z.string().optional(),
  icon: z.string().optional(),
});


interface EditGroupDialogProps {
    goalId: string;
    group: {
        name: string;
        color?: string;
        icon?: string;
    };
}

export function EditGroupDialog({ goalId, group }: EditGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            color: group.color || "#6366f1",
            icon: group.icon || "📁", 
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        const formData = new FormData();
        formData.append("goalId", goalId);
        formData.append("groupName", group.name);
        formData.append("color", values.color || "");
        formData.append("icon", values.icon || "");

        const result = await updateGroupStyleAction(formData);
        
        setLoading(false);
        if (result.success) {
            toast.success("Group style updated");
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    }

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title={`Customize "${group.name}"`}
            description="Set a specific color and icon for this group."
            trigger={
                <div 
                    role="button"
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-6 w-6 ml-2 text-muted-foreground hover:text-primary cursor-pointer")}
                >
                    <Palette className="w-3 h-3" />
                </div>
            }
        >
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {PRESET_ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => field.onChange(icon)}
                                            className={`text-2xl p-2 rounded-lg transition-all ${
                                                field.value === icon ? "bg-muted shadow-sm scale-110" : "hover:bg-muted/50"
                                            }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                    <Input 
                                        className="w-12 text-center text-lg p-0 h-10" 
                                        placeholder="+"
                                        value={PRESET_ICONS.includes(field.value || "") ? "" : field.value} 
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Color</FormLabel>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {SAFE_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => field.onChange(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                field.value === color ? "border-black scale-110" : "border-transparent hover:scale-105"
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Saving..." : "Save Style"}
                    </Button>
                </form>
            </Form>
        </ResponsiveDialog>
    );
}
