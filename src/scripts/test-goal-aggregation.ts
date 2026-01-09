import 'dotenv/config';
import dbConnect from "@/lib/db";
import Goal from "@/models/Goal";
import GoalItem from "@/models/GoalItem";
import Transaction, { TransactionType } from "@/models/Transaction";
import { createGoal, createGoalItem, getGoalDetails } from "@/services/goal.service";
import mongoose from "mongoose";

async function main() {
  await dbConnect();
  
  console.log("Creating dummy data...");
  
  // 1. Create Goal
  const goal = await createGoal({
    name: "Test Goal 2026",
    owner: "Tester",
    targetDate: new Date("2026-12-31")
  });
  console.log("Created Goal:", goal._id);

  // 2. Create Goal Item
  const item = await createGoalItem({
    goalId: goal._id,
    groupName: "Furniture",
    name: "Sofa",
    estimatedAmount: 5000000
  });
  console.log("Created Item:", item._id);

  // 3. Create Transactions linked to item
  // Transaction 1: 1,000,000
  await Transaction.create({
    amount: 1000000,
    type: TransactionType.EXPENSE,
    wallet: new mongoose.Types.ObjectId(), // dummy wallet ID
    description: "Cicilan 1 Sofa",
    goalItem: item._id,
    createdBy: "Tester",
    date: new Date()
  });

  // Transaction 2: 2,500,000
  await Transaction.create({
    amount: 2500000,
    type: TransactionType.EXPENSE,
    wallet: new mongoose.Types.ObjectId(), // dummy wallet ID
    description: "Cicilan 2 Sofa",
    goalItem: item._id,
    createdBy: "Tester",
    date: new Date()
  });

  console.log("Created 2 transactions totaling 3,500,000");

  // 4. Verify Aggregation
  console.log("Testing getGoalDetails...");
  const details = await getGoalDetails(goal._id);
  
  const fetchedItem = details.items.find((i: any) => i._id.toString() === item._id.toString());
  
  console.log("Estimated:", fetchedItem.estimatedAmount);
  console.log("Actual:", fetchedItem.actualAmount);
  
  if (fetchedItem.actualAmount === 3500000) {
    console.log("SUCCESS: Aggregation calculated correct amount.");
  } else {
    console.error(`FAILURE: Expected 3500000, got ${fetchedItem.actualAmount}`);
  }

  // Cleanup (optional, but good for repetitive runs)
//   await Goal.deleteOne({ _id: goal._id });
//   await GoalItem.deleteMany({ goalId: goal._id });
//   await Transaction.deleteMany({ goalItem: item._id });
  process.exit(0);
}

main().catch(console.error);
