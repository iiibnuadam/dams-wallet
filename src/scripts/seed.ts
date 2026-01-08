import "dotenv/config"; // Ensure .env.local is loaded
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import dbConnect from "../lib/db";
import Wallet from "../models/Wallet";
import Project from "../models/Project";
import BudgetItem from "../models/BudgetItem";
import Transaction from "../models/Transaction";
import Category from "../models/Category";
import User from "../models/User";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "src", "data");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const models: Record<string, mongoose.Model<any>> = {
  wallets: Wallet,
  projects: Project,
  budgetitems: BudgetItem,
  transactions: Transaction,
  categories: Category,
  users: User,
};

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function pullData() {
  await ensureDataDir();
  console.log("📥 Pulling data from database...");
  
  for (const [key, model] of Object.entries(models)) {
    const data = await model.find().lean();
    const filePath = path.join(DATA_DIR, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`  - Saved ${data.length} ${key} to ${filePath}`);
  }
  
  console.log("✅ Data pull complete.");
}

async function pushData() {
  await ensureDataDir();
  console.log("📤 Pushing data to database...");

  // Seed Users
  const salt = await bcrypt.genSalt(12);
  const adamPassword = await bcrypt.hash("adam123", salt);
  const sastiPassword = await bcrypt.hash("sasti123", salt);

  const defaultUsers = [
      { name: "Adam", username: "ADAM", password: adamPassword },
      { name: "Sasti", username: "SASTI", password: sastiPassword },
  ];

  for (const user of defaultUsers) {
      await User.findOneAndUpdate(
          { username: user.username },
          user,
          { upsert: true, new: true }
      );
      console.log(`  - Ensured user: ${user.username}`);
  }

  // Seed Categories
  const defaultCategories = [
      // Expense
      { name: "Food & Drink", type: "EXPENSE" },
      { name: "Transportation", type: "EXPENSE" },
      { name: "Utilities", type: "EXPENSE" },
      { name: "Shopping", type: "EXPENSE" },
      { name: "Housing", type: "EXPENSE" },
      { name: "Entertainment", type: "EXPENSE" },
      { name: "Health", type: "EXPENSE" },
      { name: "Education", type: "EXPENSE" },
      { name: "Personal Care", type: "EXPENSE" },
      { name: "Travel", type: "EXPENSE" },
      { name: "Gifts", type: "EXPENSE" },
      { name: "Subscription", type: "EXPENSE" },
      { name: "Other Expense", type: "EXPENSE" },
      
      // Income
      { name: "Salary", type: "INCOME" },
      { name: "Bonus", type: "INCOME" },
      { name: "Freelance", type: "INCOME" },
      { name: "Investment Return", type: "INCOME" },
      { name: "Gift", type: "INCOME" },
      { name: "Refund", type: "INCOME" },
      { name: "Other Income", type: "INCOME" },

      // Transfer
      { name: "E-Wallet Top Up", type: "TRANSFER" },
      { name: "Credit Card Payment", type: "TRANSFER" },
      { name: "Bank Transfer", type: "TRANSFER" },
      { name: "Withdrawal", type: "TRANSFER" },
      { name: "Investment Deposit", type: "TRANSFER" },
      { name: "Other Transfer", type: "TRANSFER" },

      // Debt & Loans
      { name: "Loan Repayment", type: "EXPENSE" },
      { name: "Debt Collection", type: "INCOME" },
      { name: "Bills", type: "EXPENSE" },  ];

  for (const cat of defaultCategories) {
      await Category.findOneAndUpdate(
          { name: cat.name, type: cat.type },
          { ...cat, isDeleted: false },
          { upsert: true, new: true }
      );
  }
  console.log(`  - Ensured ${defaultCategories.length} default categories`);

  // General Data Push for other models (Projects, etc if file exists)
  for (const [key, model] of Object.entries(models)) {
    if (key === 'users' || key === 'categories') continue; // Handled above

    const filePath = path.join(DATA_DIR, `${key}.json`);
    try {
      await fs.access(filePath);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(fileContent);

      if (Array.isArray(data) && data.length > 0) {
          let upsertCount = 0;
          for (const item of data) {
              if (item._id) {
                  await model.updateOne({ _id: item._id }, item, { upsert: true });
                  upsertCount++;
              } else {
                  await model.create(item);
                  upsertCount++;
              }
          }
         console.log(`  - Upserted ${upsertCount} ${key} from ${filePath}`);
      }
    } catch (e) {
      // Ignore if file doesn't exist, just means no backup to restore for that model
    }
  }

  console.log("✅ Data push complete.");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined.");
      process.exit(1);
  }

  await dbConnect();

  try {
    if (command === "--pull") {
      await pullData();
    } else if (command === "--push") {
      await pushData();
    } else {
      console.log("Usage: npm run seed -- < --pull | --push >");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

main();
