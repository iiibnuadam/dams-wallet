import { TransactionsView } from "@/components/transactions/TransactionsView";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Transactions | Dams Wallet",
    description: "View your transaction history across all wallets.",
};

export default function TransactionsPage() {
    return <TransactionsView />;
}
