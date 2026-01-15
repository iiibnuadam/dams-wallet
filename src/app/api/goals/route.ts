import { NextResponse } from "next/server";
import { getGoals } from "@/services/goal.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session?.user as any)?.id;

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    
    // Pass view or fallback to userId (service handles "ALL" logic if passed, or specific ID)
    const data = await getGoals(view || userId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}
