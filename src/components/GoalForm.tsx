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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { createGoalAction, updateGoalAction } from "@/actions/goal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SAFE_COLORS, PRESET_ICONS } from "@/lib/constants";

// ... imports remain the same

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetDate: z.string().min(1, "Target date is required"),
  visibility: z.enum(["PRIVATE", "SHARED"]),
  color: z.string().optional(),
  icon: z.string().optional(),
});

interface GoalFormProps {
    defaultValues?: Partial<z.infer<typeof formSchema>>;
    goalId?: string; // If present, it's an edit
    onSuccess?: () => void;
}

export function GoalForm({ defaultValues, goalId, onSuccess }: GoalFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: defaultValues?.name || "",
            targetDate: defaultValues?.targetDate ? new Date(defaultValues.targetDate).toISOString().split('T')[0] : "",
            visibility: defaultValues?.visibility || "SHARED",
            color: defaultValues?.color || SAFE_COLORS[7], // Default to Indigo
            icon: defaultValues?.icon || "🎯",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("targetDate", values.targetDate);
        formData.append("visibility", values.visibility);
        formData.append("color", values.color || "");
        formData.append("icon", values.icon || "");

        const result = goalId 
            ? await updateGoalAction(goalId, null, formData)
            : await createGoalAction(null, formData);
        
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            if (onSuccess) onSuccess();
            router.refresh();
             if (!goalId) router.push("/goals");
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Icon</FormLabel>
                             <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-xl bg-card">
                                {PRESET_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => field.onChange(icon)}
                                        className={`text-xl p-2 rounded-lg transition-all ${
                                            field.value === icon ? "bg-primary/20 shadow-sm scale-110 ring-2 ring-primary/50" : "hover:bg-muted/50"
                                        }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                                <Input 
                                    className="w-12 text-center text-lg p-0 h-10 border-dashed" 
                                    placeholder="+"
                                    value={PRESET_ICONS.includes(field.value || "") ? "" : field.value} 
                                    onChange={(e) => field.onChange(e.target.value)}
                                />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Name and Target Date fields remain same... */}

                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Goal Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. New House" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Target Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Visibility</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="SHARED" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Shared (Couple)
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="PRIVATE" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Private (Only Me)
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
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
                            <FormLabel>Theme Color</FormLabel>
                            <div className="flex flex-wrap gap-3 mt-2">
                                {SAFE_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => field.onChange(color)}
                                        className={`w-8 h-8 rounded-full transition-all ${
                                            field.value === color ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-110"
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
                    {loading ? "Saving..." : (goalId ? "Update Goal" : "Create Goal")}
                </Button>
            </form>
        </Form>
    );
}
