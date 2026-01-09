"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as DebtService from "@/services/debt.service";
import { revalidatePath } from "next/cache";

export async function getDebtsAction() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return [];
    
    return DebtService.getDebts((session.user as any).id);
}

export async function createDebtAction(data: any) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return { success: false, message: "Unauthorized" };

    try {
        await DebtService.createDebt({ ...data, loanDate: data.loanDate || undefined }, (session.user as any).id);
        revalidatePath("/debts");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to create debt record" };
    }
}

export async function updateDebtAction(id: string, data: any) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return { success: false, message: "Unauthorized" };

    try {
        await DebtService.updateDebt(id, data, (session.user as any).id);
        revalidatePath("/debts");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to update debt record" };
    }
}

export async function deleteDebtAction(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return { success: false, message: "Unauthorized" };

    try {
        await DebtService.deleteDebt(id, (session.user as any).id);
        revalidatePath("/debts");
        return { success: true };
    } catch (error) {
        return { success: false, message: "Failed to delete debt" };
    }
}

export async function settleDebtAction(id: string, walletId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) return { success: false, message: "Unauthorized" };

    try {
        const { settleDebt } = await import("@/services/debt.service");
        await settleDebt(id, walletId, (session.user as any).id);
        revalidatePath("/debts");
        revalidatePath("/"); // Update dashboard stats
        revalidatePath("/transactions"); // Update transaction list
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to settle debt" };
    }
}
