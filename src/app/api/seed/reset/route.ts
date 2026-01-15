
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import Goal from "@/models/Goal";
import GoalItem from "@/models/GoalItem";
import MonthlyBudget from "@/models/MonthlyBudget";
import BudgetItem from "@/models/BudgetItem";
import Debt from "@/models/Debt";
import Routine from "@/models/Routine";
import Wallet from "@/models/Wallet";

export async function POST() {
  try {
    await dbConnect();

    // Delete all transactional and setup data
    const deletions = await Promise.all([
        Transaction.deleteMany({}),
        Goal.deleteMany({}),
        GoalItem.deleteMany({}),
        MonthlyBudget.deleteMany({}),
        BudgetItem.deleteMany({}),
        Debt.deleteMany({}),
        Routine.deleteMany({}),
        Wallet.deleteMany({}) 
    ]);

    return NextResponse.json({ 
        success: true, 
        message: "All transactional data cleared. Users and Categories preserved.",
        deletedCounts: {
            transactions: deletions[0].deletedCount,
            goals: deletions[1].deletedCount,
            goalItems: deletions[2].deletedCount,
            budgetItems: deletions[4].deletedCount,
            debts: deletions[5].deletedCount,
            routines: deletions[6].deletedCount,
            wallets: deletions[7].deletedCount
        }
    });
  } catch (error: any) {
    console.error("Reset failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
