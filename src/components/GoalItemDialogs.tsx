"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { GoalItemForm } from "./GoalItemForm";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { deleteGoalItemAction } from "@/actions/goal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

interface AddGoalItemDialogProps {
    goalId: string;
    existingGroups?: string[];
}

export function AddGoalItemDialog({ goalId, existingGroups }: AddGoalItemDialogProps) {
    const [open, setOpen] = useState(false);
    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title="Add Budget Item"
            description="Add a new item to your budget breakdown."
            trigger={
                <Button size="sm" variant="outline" className="gap-2 h-8">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                </Button>
            }
        >
            <GoalItemForm goalId={goalId} existingGroups={existingGroups} onSuccess={() => setOpen(false)} />
        </ResponsiveDialog>
    );
}

interface EditGoalItemDialogProps {
    goalId: string;
    item: {
        _id: string;
        groupName: string;
        name: string;
        estimatedAmount: number;
    };
    existingGroups?: string[];
}

export function EditGoalItemDialog({ goalId, item, existingGroups }: EditGoalItemDialogProps) {
    const [open, setOpen] = useState(false);
    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title="Edit Item"
            description="Update budget item details."
            trigger={
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                </Button>
            }
        >
            <GoalItemForm 
                goalId={goalId}
                itemId={item._id}
                existingGroups={existingGroups}
                defaultValues={item}
                onSuccess={() => setOpen(false)} 
            />
        </ResponsiveDialog>
    );
}

interface DeleteGoalItemDialogProps {
    goalId: string;
    itemId: string;
    itemName: string;
}

export function DeleteGoalItemDialog({ goalId, itemId, itemName }: DeleteGoalItemDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    async function onDelete(e: React.MouseEvent) {
        e.preventDefault();
        setLoading(true);
        const result = await deleteGoalItemAction(itemId, goalId);
        
        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete "{itemName}"? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600" disabled={loading}>
                        {loading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
