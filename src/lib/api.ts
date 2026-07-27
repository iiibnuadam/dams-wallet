import { getSession } from "next-auth/react";

const API_URL = typeof window === "undefined" 
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api") 
    : "/api";

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;

  // Build URL with query params if provided
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Get session to retrieve JWT
  let token: string | undefined;

  if (typeof window === "undefined") {
    // Server-side
    try {
        const { getServerSession } = await import("next-auth");
        const { authOptions } = await import("./auth");
        const session = await getServerSession(authOptions);
        token = (session as any)?.user?.accessToken;
    } catch (error: any) {
        if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.message?.includes("Dynamic server usage")) {
            throw error; // Let Next.js handle dynamic bailout
        }
        console.error("Error getting server session in apiFetch:", error);
    }
  } else {
    // Client-side
    const session = await getSession();
    token = (session as any)?.user?.accessToken;
  }

  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok || (result.code && result.code >= 400)) {
    throw new Error(result.message || "Something went wrong");
  }

  // Backend wraps data in { code: 200, status: "OK", data: ... }
  return result.data as T;
}

// Helper for server-side calls where we already have the token
export async function apiFetchServer<T>(endpoint: string, token: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  if (!response.ok || (result.code && result.code >= 400)) {
    throw new Error(result.message || "Something went wrong");
  }

  return result.data as T;
}
