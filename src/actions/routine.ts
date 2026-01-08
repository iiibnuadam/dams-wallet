"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as RoutineService from "@/services/routine.service";
import { revalidatePath } from "next/cache";

export async function checkAndGenerateRoutinesAction() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return { success: false };

    // We assume session.user.name is the username (ADAM/SASTI)
    const count = await RoutineService.checkAndGenerateRoutines(session.user.name);
    return { success: true, count };
}

export async function getPendingTransactionsAction() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return [];

    return RoutineService.getPendingTransactions(session.user.name);
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
            owner: session.user.name
        });
        revalidatePath("/routines");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to create routine" };
    }
}

export async function getRoutinesAction() {
     const session = await getServerSession(authOptions);
     if (!session || !session.user || !session.user.name) return [];
     
     return RoutineService.getRoutines(session.user.name);
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
