import { apiFetch } from "../lib/api";

export async function createRoutine(data: any) {
    return apiFetch<any>("/routines", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getRoutines(owner?: string) {
    return apiFetch<any[]>("/routines", {
        params: { owner },
    });
}

export async function updateRoutine(id: string, data: any) {
    return apiFetch<any>(`/routines/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteRoutine(id: string) {
    return apiFetch<void>(`/routines/${id}`, {
        method: "DELETE",
    });
}

export async function checkAndGenerateRoutines() {
    return apiFetch<number>("/routines/check", {
        method: "POST",
    });
}

export async function getPendingTransactions() {
    return apiFetch<any[]>("/routines/pending");
}

// Transaction confirmation now handled by Transaction service confirmTransaction
export async function confirmTransaction(transactionId: string) {
    return apiFetch<void>(`/transactions/${transactionId}/confirm`, {
        method: "PATCH",
    });
}

export async function deleteTransaction(transactionId: string) {
    return apiFetch<void>(`/transactions/${transactionId}`, {
        method: "DELETE",
    });
}
