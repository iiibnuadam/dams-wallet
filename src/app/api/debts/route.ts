import { NextResponse } from "next/server";
import { getDebts } from "@/services/debt.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ code: 401 , status: "Error", message: "Unauthorized" }, { status: 401  });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    // If view is provided, use it. Otherwise default to current user (handled by getDebts('ALL') ? No, getDebts(ownerId))
    const debts = await getDebts(view || (session.user as any).id);
    
    return NextResponse.json({ code: 200, status: "OK", message: "Success", data: debts });
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json({ code: 500, status: "Error", message: "Failed to fetch debts" }, { status: 500 });
  }
}
export { POST, PUT, DELETE, PATCH } from "@/app/api/[...path]/route";
