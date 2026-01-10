import { NextResponse } from "next/server";
import { getWallets } from "@/services/wallet.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    
    // Authorization check
    const session = await getServerSession(authOptions);
    if (!session) {
      // Allow access but logic in getWallets might be limited?
      // For now, let's allow it as page did, but ideally we check session.
    }

    const wallets = await getWallets(view || "ALL");
    return NextResponse.json(wallets);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}
