import { Navbar } from "@/components/Navbar";
import { DebtList } from "@/components/debt/DebtList";
import { DebtFormDialog } from "@/components/debt/DebtFormDialog";
import { History } from "lucide-react";

export default async function DebtsPage() {
  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
      <main className="px-4 py-8 space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Debt & Receivables
                <History className="w-6 h-6" />
            </h1>
            <p className="text-muted-foreground">Track who owes you and who you owe.</p>
        </div>

        <DebtList />
      </main>
    </div>
  );
}
