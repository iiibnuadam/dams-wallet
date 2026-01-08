"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionList } from "@/components/TransactionList";

interface RecentTransactionsProps {
  transactions: any[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest 5 transactions across all wallets.</CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionList transactions={transactions} />
      </CardContent>
    </Card>
  );
}
