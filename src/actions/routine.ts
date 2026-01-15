"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as RoutineService from "@/services/routine.service";
import { revalidatePath } from "next/cache";

export async function checkAndGenerateRoutinesAction() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return { success: false };

    // We assume session.user.id is the User ID
    const count = await RoutineService.checkAndGenerateRoutines((session.user as any).id);
    return { success: true, count };
}

export async function getPendingTransactionsAction() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return [];

    return RoutineService.getPendingTransactions((session.user as any).id);
}

export async function confirmTransactionAction(id: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    return RoutineService.confirmTransaction(id);
}

export async function deleteTransactionAction(id: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    return RoutineService.deleteTransaction(id);
}

export async function createRoutineAction(data: any) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return { success: false, message: "Unauthorized" };

    try {
        await RoutineService.createRoutine({
            ...data,
            ...data,
            owner: (session.user as any).id
        });
        revalidatePath("/routines");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to create routine" };
    }
}

export async function getRoutinesAction(view?: string) {
     const session = await getServerSession(authOptions);
     if (!session || !session.user || !session.user.name) return [];
     
     // If view is provided, use it. If not, default to current user ID (backward compatibility)
     if (view) return RoutineService.getRoutines(view);
     
     return RoutineService.getRoutines((session.user as any).id);
}

export async function updateRoutineAction(id: string, data: any) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, message: "Unauthorized" };

    try {
        await RoutineService.updateRoutine(id, data);
        revalidatePath("/routines");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to update routine" };
    }
}

export async function deleteRoutineAction(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, message: "Unauthorized" };

    try {
        await RoutineService.deleteRoutine(id);
        revalidatePath("/routines");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to delete routine" };
    }
}
