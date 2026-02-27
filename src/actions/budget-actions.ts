"use server";

import { BudgetService } from "@/services/budget.service";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type Session = { user: { id: string } };

async function getSession() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as Session["user"])?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getBudgetOverviewAction(period: string) {
  const userId = await getSession();
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error("Invalid period format");
  const overview = await BudgetService.getBudgetOverview(userId, period);
  return JSON.parse(JSON.stringify(overview));
}

export async function upsertEnvelopesAction(
  period: string,
  envelopes: { groupName: string; type: "NEEDS" | "WANTS" | "SAVINGS"; icon: string; color: string; limit: number }[],
  income: number
) {
  const userId = await getSession();
  const result = await BudgetService.upsertEnvelopes(userId, period, envelopes, income);
  revalidatePath("/budget");
  return JSON.parse(JSON.stringify(result));
}

export async function getAvailableGroupsAction() {
  await getSession();
  const groups = await BudgetService.getAvailableGroups();
  return JSON.parse(JSON.stringify(groups));
}
