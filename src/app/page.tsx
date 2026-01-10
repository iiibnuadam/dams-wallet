import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  
  // Determine view: param > session user > ALL
  let currentView = params.view;
  if (!currentView && session?.user?.email) {
    if (session.user.email.includes("adam")) currentView = "ADAM";
    else if (session.user.email.includes("sasti")) currentView = "SASTI";
  }
  const viewToUse = currentView || "ALL";

  return (
      <DashboardView initialView={viewToUse} />
  );
}
