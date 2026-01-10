import { TransactionsView } from "@/components/transactions/TransactionsView";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Transactions | Dams Wallet",
    description: "View your transaction history across all wallets.",
};

export default function TransactionsPage() {
    return (
        <Suspense fallback={<div>Loading transactions...</div>}>
            <TransactionsView />
        </Suspense>
    );
}
