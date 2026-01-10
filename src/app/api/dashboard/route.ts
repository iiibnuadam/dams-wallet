
import { NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboard.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    // Convert all search params to object
    const params = Object.fromEntries(searchParams.entries());

    const data = await getDashboardData(view || "ALL", params);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
