import { getGoalDetails } from "@/services/goal.service";
import { notFound } from "next/navigation";
import { getWallets } from "@/services/wallet.service";
import { GoalDetailView } from "@/components/GoalDetailView";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const goal = await getGoalDetails(id);
  
  if (!goal) {
    notFound();
  }

  // Fetch wallets for the dialog (passed down to View -> Dialog)
  const wallets = await getWallets(); 

  return <GoalDetailView goal={goal} wallets={wallets} />;
}
