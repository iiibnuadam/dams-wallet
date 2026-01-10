import { NextResponse } from "next/server";
import { getGoals } from "@/services/goal.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session?.user as any)?.id;

    // getGoals service handles "undefined" user by showing shared. 
    // But ideally we pass userId if logged in.
    const data = await getGoals(userId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}
