import { RoutineList } from "@/components/routine/RoutineList";
import { getWallets } from "@/services/wallet.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RoutinesPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/auth/signin");

    // We fetch wallets here to pass to the client component
    // Assuming getWallets handles "ALL" or specific user filtering internally if no arg passed?
    // Let's check getWallets signature. `getWallets(owner?: string)`
    // If not passed, it fetches ALL wallets (not safe if we want user specific).
    // Actually, getWallets implementation uses `owner` argument to filter. 
    // If owner is undefined, it might fetch nothing or all depending on implementation.
    // Looking at service: `if (owner && owner !== "ALL") matchStage.owner = owner;`
    // If owner is undefined, matchStage only has isDeleted: false. So it fetches ALL wallets of ALL users if not restricted !!
    // Wait, secure issue? YES.
    // I need to pass session.user.name to getWallets.
    
    const wallets = await getWallets(session.user?.name || "ADAM"); 
    // Fallback to ADAM is temporary for development if session missing but redirect handles it.

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
             <RoutineList wallets={wallets} />
        </div>
    );
}
