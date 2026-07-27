import { apiFetch } from "../lib/api";

export async function getUserProfile() {
    return apiFetch<any>("/auth/profile");
}

export async function updateProfile(data: { name: string; password?: string }) {
    return apiFetch<any>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}
