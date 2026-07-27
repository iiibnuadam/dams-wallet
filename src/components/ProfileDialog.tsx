"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import * as UserService from "@/services/user.service";
import { Loader2 } from "lucide-react";
// import { toast } from "sonner"; // Removed as it is not installed

// If sonner is not installed, we'll use window.alert or a simple error state. 
// Given the project setup, I haven't seen sonner installed. I'll use simple alert for now or implement a basic toast if needed.
// Actually, let's just use alert as in other components for simplicity and consistency with previous dialogs.

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().optional(), // Read-only
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ProfileDialog({ open, onOpenChange, trigger }: ProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (open) {
        setFetching(true);
        UserService.getUserProfile().then((data) => {
            if (data) {
                form.reset({
                    name: data.name,
                    username: data.username,
                    password: "",
                    confirmPassword: "",
                });
            }
        }).catch((err) => {
            console.error("Failed to fetch profile", err);
        }).finally(() => {
            setFetching(false);
        });
    }
  }, [open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const payload: any = {
      name: values.name,
    };
    if (values.password) {
        payload.password = values.password;
    }

    try {
        await UserService.updateProfile(payload);
        onOpenChange(false);
        toast.success("Profile updated successfully");
        // Also refresh router so data re-fetches
        window.location.reload(); 
    } catch (error: any) {
        toast.error(error.message || "Failed to update profile");
    } finally {
        setLoading(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Profile"
      description="Update your personal information."
      trigger={trigger}
    >
        {fetching ? (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        ) : (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                        <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="(Optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="(Optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
                </form>
            </Form>
        )}
    </ResponsiveDialog>
  );
}
