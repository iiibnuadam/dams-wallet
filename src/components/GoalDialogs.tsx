"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { GoalForm } from "./GoalForm";
import { Plus, Pencil } from "lucide-react";

export function AddGoalDialog() {
    const [open, setOpen] = useState(false);
    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title="Create New Goal"
            description="Set a financial target for your future."
            trigger={
                <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Goal
                </Button>
            }
        >
            <GoalForm onSuccess={() => setOpen(false)} />
        </ResponsiveDialog>
    );
}

interface EditGoalDialogProps {
    goal: {
        _id: string;
        name: string;
        targetDate: string;
        visibility: "PRIVATE" | "SHARED";
        color?: string;
    };
    trigger?: React.ReactNode;
}

export function EditGoalDialog({ goal, trigger }: EditGoalDialogProps) {
    const [open, setOpen] = useState(false);
    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title="Edit Goal"
            description="Update your goal details."
            trigger={trigger || (
                <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                </Button>
            )}
        >
            <GoalForm 
                onSuccess={() => setOpen(false)} 
                goalId={goal._id}
                defaultValues={{
                    name: goal.name,
                    targetDate: goal.targetDate,
                    visibility: goal.visibility,
                    color: goal.color
                }}
            />
        </ResponsiveDialog>
    );
}
