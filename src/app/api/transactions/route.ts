import { NextResponse } from "next/server";
import { getTransactions } from "@/services/transaction.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);

    // Build params object from searchParams
    const params: any = Object.fromEntries(searchParams.entries());

    // Inject currentUser if valid session, unless explicitly handled?
    // Service logic: `currentUser` param is used for "ME/OTHERS" filter.
    // We should probably rely on session for security.
    if (session?.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params.currentUser = (session.user as any).id;
    }

    const data = await getTransactions(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
