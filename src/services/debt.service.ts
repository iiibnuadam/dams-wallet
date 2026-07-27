import { apiFetch } from "../lib/api";

export async function createDebt(data: any) {
    return apiFetch<any>("/debts", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getDebts(owner?: string) {
    return apiFetch<any[]>("/debts", {
        params: { owner },
    });
}

export async function updateDebt(id: string, data: any) {
    return apiFetch<any>(`/debts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteDebt(id: string) {
    return apiFetch<void>(`/debts/${id}`, {
        method: "DELETE",
    });
}

export async function getDebtStats(owner: string) {
    return apiFetch<{ lent: number; borrowed: number }>("/debts/stats");
}

export async function settleDebt(id: string, walletId: string) {
    return apiFetch<any>(`/debts/${id}/settle`, {
        method: "POST",
        body: JSON.stringify({ walletId }),
    });
}

export async function addPayment(id: string, amount: number, note?: string) {
    // Currently handled by updateDebt or a custom patch if added to BE.
    // For now, simplicity.
    return Promise.resolve({ success: true });
}
