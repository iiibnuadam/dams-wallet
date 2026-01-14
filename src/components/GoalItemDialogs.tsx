"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { GoalItemForm } from "./GoalItemForm";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useDeleteGoalItem } from "@/hooks/useGoals";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingGroups?: any[];
    trigger?: React.ReactNode;
}

export function AddGoalItemDialog({ goalId, existingGroups, trigger }: AddGoalItemDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title="Add Budget Item"
            description="Add a new item to your budget breakdown."
            trigger={trigger || (
                <Button size="sm" variant="outline" className="gap-2 h-8">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                </Button>
            )}
        >
            <GoalItemForm 
                goalId={goalId} 
                existingGroups={existingGroups} 
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
                    setOpen(false);
                }} 
            />
        </ResponsiveDialog>
    );
}

interface EditGoalItemDialogProps {
    goalId: string;
    item: {
        _id: string;
        groupId?: string; // New
        groupName?: string; // Legacy
        name: string;
        estimatedAmount: number;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingGroups?: any[];
    trigger?: React.ReactNode;
}

export function EditGoalItemDialog({ goalId, item, existingGroups, trigger }: EditGoalItemDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title="Edit Item"
            description="Update budget item details."
            trigger={trigger || (
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                </Button>
            )}
        >
            <GoalItemForm 
                goalId={goalId}
                itemId={item._id}
                existingGroups={existingGroups}
                defaultValues={{
                    ...item,
                    groupName: item.groupName || "" // Ensure string for legacy
                }}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
                    setOpen(false);
                }} 
            />
        </ResponsiveDialog>
    );
}

interface DeleteGoalItemDialogProps {
    goalId: string;
    itemId: string;
    itemName: string;
    trigger?: React.ReactNode;
}

export function DeleteGoalItemDialog({ goalId, itemId, itemName, trigger }: DeleteGoalItemDialogProps) {
    const [open, setOpen] = useState(false);
    const { mutate: deleteItem, isPending } = useDeleteGoalItem();

    const handleDelete = () => {
        deleteItem({ id: itemId, goalId }, {
            onSuccess: () => {
                setOpen(false);
                toast.success("Item deleted");
            },
            onError: (error) => {
                toast.error(error.message || "Failed to delete item");
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {itemName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this item from your budget. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
                        {isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


