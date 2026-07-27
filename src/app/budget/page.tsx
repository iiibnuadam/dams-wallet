import BudgetDashboard from "@/components/budget/BudgetDashboard";
import { Metadata } from "next";
import { Suspense } from "react";
import { BudgetSkeleton } from "@/components/budget/BudgetSkeleton";
export const metadata: Metadata = {
  title: "Monthly Budget | DAMS Wallet",
  description: "Track your monthly spending limits and manage your budget.",
};

export default function BudgetPage() {
  return (
    <div className="container py-8 mx-auto">
      <Suspense fallback={<BudgetSkeleton />}>
         <BudgetDashboard />
      </Suspense>
    </div>
  );
}
