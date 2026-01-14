import BudgetDashboard from "@/components/budget/BudgetDashboard";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Monthly Budget | DAMS Wallet",
  description: "Track your monthly spending limits and manage your budget.",
};

export default function BudgetPage() {
  return (
    <div className="container py-8 space-y-8">
      <Suspense fallback={<div>Loading budget view...</div>}>
         <BudgetDashboard />
      </Suspense>
    </div>
  );
}
