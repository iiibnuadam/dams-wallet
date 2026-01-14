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
import { getUserProfile, updateProfile } from "@/actions/user";
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
        getUserProfile().then((result) => {
            if (result.success && result.data) {
                form.reset({
                    name: result.data.name,
                    username: result.data.username,
                    password: "",
                    confirmPassword: "",
                });
            } else {
                // handle error
                console.error("Failed to fetch profile");
            }
            setFetching(false);
        });
    }
  }, [open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.password) {
        formData.append("password", values.password);
        formData.append("confirmPassword", values.confirmPassword || "");
    }

    const result = await updateProfile(formData);

    setLoading(false);

    if (result.success) {
      onOpenChange(false);
      // Optional: Refresh session/page if name changed extensively? 
      // NextAuth session update requires client side reload or update() call.
      // For now, revalidatePath in action handles data, but session might confuse "name" vs "username".
      // We only store "username" in session.user.name. The real name is not in session.
      // So no session update needed unless we start storing real name in session.
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.message);
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
