import { NextResponse } from "next/server";
import { getGoalDetails } from "@/services/goal.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: Request, context: any) {
  // Awaiting context.params is required in Next.js 15, 
  // but if using older version checking type might be needed. 
  // Assuming Next.js 14/15 based on "await params" in page.tsx previously seen.
  const { id } = await context.params;
  
  if (!id) {
    return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
  }

  try {
    const data = await getGoalDetails(id);
    if (!data) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}
