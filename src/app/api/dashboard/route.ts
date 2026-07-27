
import { NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboard.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    // Convert all search params to object
    // Convert all search params to object
    const params = Object.fromEntries(searchParams.entries());

    const data = await getDashboardData(view || "ALL", params);

    return NextResponse.json({ code: 200, status: "OK", message: "Success", data: data });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    const status = error.message?.includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ code: status, status: "Error", message: error.message || "Internal Server Error" }, { status });
  }
}
export { POST, PUT, DELETE, PATCH } from "@/app/api/[...path]/route";
