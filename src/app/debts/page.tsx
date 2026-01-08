import { Navbar } from "@/components/Navbar";
import { DebtList } from "@/components/debt/DebtList";
import { DebtFormDialog } from "@/components/debt/DebtFormDialog";

export default async function DebtsPage() {
  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-10">
      
      <main className="px-4 py-8 space-y-6">
        <DebtList />
      </main>
    </div>
  );
}
