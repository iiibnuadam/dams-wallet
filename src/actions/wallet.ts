"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Wallet from "@/models/Wallet";
import { WalletType, WalletOwner } from "@/types/wallet";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WalletSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(WalletType),
  initialBalance: z.coerce.number().default(0),
  color: z.string().optional().default("BLUE"),
});

export async function createWallet(prevState: unknown, formData: FormData) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { message: "Unauthorized", success: false };
    }

    // Map session user to WalletOwner
    let owner: WalletOwner;
    const userName = session.user.name?.toUpperCase();

    if (userName === "ADAM") {
        owner = WalletOwner.ADAM;
    } else if (userName === "SASTI") {
        owner = WalletOwner.SASTI;
    } else {
        // Fallback or error - for now defaulting to ADAM for dev if unknown, or error
        // Better to error to be safe
        return { message: "Invalid user for wallet creation", success: false };
    }

    const initialBalanceRaw = formData.get("initialBalance")?.toString() || "0";
    const initialBalanceClean = initialBalanceRaw.replace(/\D/g, "");

    const rawData = {
      name: formData.get("name"),
      type: formData.get("type"),
      initialBalance: initialBalanceClean,
      color: formData.get("color"),
    };

    const validatedData = WalletSchema.parse(rawData);

    await dbConnect();

    await Wallet.create({
      ...validatedData,
      owner,
      isDeleted: false,
    });

    revalidatePath("/");
    return { message: "Wallet created successfully", success: true };
  } catch (error) {
    console.error("Failed to create wallet:", error);
    return { message: "Failed to create wallet", success: false, error: (error as Error).message };
  }
}

export async function updateWallet(id: string, prevState: unknown, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  // Reuse Schema but allow optional fields if we wanted partial updates, 
  // but for edit form we usually send everything. 
  // However, Owner is not in the create schema. We should probably expand schema or make a new one.
  // For simplicity, let's parse raw data here or make an extended schema.
  
  const UpdateWalletSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.nativeEnum(WalletType),
    owner: z.nativeEnum(WalletOwner),
    initialBalance: z.coerce.number(),
    color: z.string().optional(),
    liabilityStartDate: z.string().optional(),
    liabilityTenor: z.coerce.number().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
  });

  const initialBalanceRaw = formData.get("initialBalance")?.toString() || "0";
  const initialBalanceClean = initialBalanceRaw.replace(/\D/g, "");

  const rawData = {
    name: formData.get("name"),
    type: formData.get("type"),
    owner: formData.get("owner"),
    initialBalance: initialBalanceClean,
    color: formData.get("color"),
    liabilityStartDate: formData.get("liabilityStartDate") || undefined,
    liabilityTenor: formData.get("liabilityTenor") || undefined,
    bankName: formData.get("bankName") || undefined,
    accountNumber: formData.get("accountNumber") || undefined,
    accountHolder: formData.get("accountHolder") || undefined,
  };

  const parsed = UpdateWalletSchema.safeParse(rawData);

  if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(i => i.message).join(", ");
      return { success: false, message: errorMessages };
  }

  const data = parsed.data;

  try {
      await dbConnect();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
          name: data.name,
          type: data.type,
          owner: data.owner,
          initialBalance: data.initialBalance,
          color: data.color || "BLUE",
      };

      if (data.type === WalletType.LIABILITY) {
          updateData.liabilityDetails = {
              startDate: data.liabilityStartDate ? new Date(data.liabilityStartDate) : undefined,
              tenorMonths: data.liabilityTenor
          };
      } else {
           updateData.liabilityDetails = undefined; // Clear if changing type
      }

      if (data.type === WalletType.BANK) {
        updateData.bankDetails = {
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountHolder: data.accountHolder,
        };
      } else {
        updateData.bankDetails = undefined; // Clear if changing type
      }

      await Wallet.findByIdAndUpdate(id, updateData);

      revalidatePath("/");
      revalidatePath(`/wallets/${id}`);
      return { success: true, message: "Wallet updated successfully" };
  } catch (e: unknown) {
      console.error("Update Wallet Error:", e);
      return { success: false, message: (e as any).message || "Failed to update wallet" };
  }
}

export async function deleteWallet(id: string) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await dbConnect();
        await Wallet.findByIdAndUpdate(id, { isDeleted: true });
        
        revalidatePath("/");
        revalidatePath("/wallets");
        return { success: true, message: "Wallet deleted successfully" };
    } catch (e) {
        console.error("Delete Wallet Error:", e);
        return { success: false, message: "Failed to delete wallet" };
    }
}

export async function getWalletsAction() {
    const session = await getServerSession(authOptions);
    if (!session) return [];
    
    try {
        const { getWallets } = await import("@/services/wallet.service");
        // Determine owner based on session or default to ADAM
        const owner = session.user.name === "SASTI" ? "SASTI" : "ADAM";
        const wallets = await getWallets(owner);
        return JSON.parse(JSON.stringify(wallets));
    } catch (error) {
        console.error("Failed to fetch wallets:", error);
        return [];
    }
}
