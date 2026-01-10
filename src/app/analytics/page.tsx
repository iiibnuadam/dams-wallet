import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<any> }) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  let currentView = params.view;
  if (!currentView && session?.user?.email) {
    if (session.user.email.includes("adam")) currentView = "ADAM";
    else if (session.user.email.includes("sasti")) currentView = "SASTI";
  }
  const viewToUse = currentView || "ALL";

  return <AnalyticsView initialView={viewToUse} />;
}
