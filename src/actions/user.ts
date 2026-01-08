"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUserProfile() {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // We use the username from session to find the user, as ID might be tricky if not fully synced
        // But authOptions callbacks ensure session.user.name is the username
        const user = await User.findOne({ username: session.user.name });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        return {
            success: true,
            data: {
                name: user.name,
                username: user.username,
            }
        };
    } catch (error) {
        console.error("Error fetching profile:", error);
        return { success: false, message: "Failed to fetch profile" };
    }
}

export async function updateProfile(formData: FormData) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { success: false, message: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!name) {
        return { success: false, message: "Name is required" };
    }

    try {
        const user = await User.findOne({ username: session.user.name });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        user.name = name;

        if (password) {
            if (password !== confirmPassword) {
                return { success: false, message: "Passwords do not match" };
            }
            if (password.length < 6) {
                return { success: false, message: "Password must be at least 6 characters" };
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        revalidatePath("/");
        
        return { success: true, message: "Profile updated successfully" };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, message: "Failed to update profile" };
    }
}
