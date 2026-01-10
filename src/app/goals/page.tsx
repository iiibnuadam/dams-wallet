import { Target } from "lucide-react";
import { AddGoalDialog } from "@/components/GoalDialogs";
import { GoalList } from "@/components/goals/GoalList";

export const dynamic = "force-dynamic";

export default function GoalsPage() {
  // Client component GoalList handles fetching
  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Target className="w-8 h-8 text-primary" />
                    </div>
                    Financial Goals
                </h1>
                <p className="text-muted-foreground mt-1 ml-1">Track and manage your savings targets.</p>
            </div>
            <AddGoalDialog />
        </div>

        <GoalList />
      </main>
    </div>
  );
}
