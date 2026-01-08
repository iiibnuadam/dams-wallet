import { NextResponse } from "next/server";
import { getWallets } from "@/services/wallet.service";

export async function GET() {
  try {
    const wallets = await getWallets();
    return NextResponse.json(wallets);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}
