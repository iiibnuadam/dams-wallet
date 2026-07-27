export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

async function handleProxy(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    
    // Extract the path after /api/
    // e.g. /api/transactions -> transactions
    const apiPath = url.pathname.replace(/^\/api\/?/, '');
    
    // Construct the backend URL
    let targetUrl = `${BACKEND_URL}/${apiPath}`;
    if (queryString) {
      targetUrl += `?${queryString}`;
    }

    const headers = new Headers(request.headers);
    // Add authorization header if session exists
    if (session?.user && (session.user as any).accessToken) {
      headers.set("Authorization", `Bearer ${(session.user as any).accessToken}`);
    }
    
    // We strip the host header to avoid conflicts when proxying
    headers.delete("host");

    // We shouldn't forward Next.js specific headers that might confuse the backend
    headers.delete("x-forwarded-for");
    headers.delete("x-forwarded-host");
    headers.delete("x-forwarded-proto");
    
    // Need to avoid conflict with backend's expected content length
    headers.delete("content-length");

    const reqInit: RequestInit = {
      method: request.method,
      headers,
      cache: "no-store",
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      reqInit.body = await request.text();
    }

    // Fetch from backend
    const backendResponse = await fetch(targetUrl, reqInit);

    // Get the response
    const body = await backendResponse.text();
    
    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Proxy Error for ${request.url}:`, error);
    return NextResponse.json(
      { code: 500, status: "Error", message: "Failed to proxy request" },
      { status: 500 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
