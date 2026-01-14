
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";

const DEFAULT_CATEGORIES = [
  // --- GROUP: HOUSING (RUMAH & UTILITAS) ---
  { "name": "KPR / Sewa Rumah", "type": "EXPENSE", "flexibility": "FIXED", "group": "Housing", "bucket": "NEEDS", "color": "bg-emerald-600", "icon": "🏠" },
  { "name": "IPL & Keamanan", "type": "EXPENSE", "flexibility": "FIXED", "group": "Housing", "bucket": "NEEDS", "color": "bg-emerald-500", "icon": "👮‍♂️" },
  { "name": "Listrik (PLN)", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Housing", "bucket": "NEEDS", "color": "bg-yellow-500", "icon": "⚡️" },
  { "name": "Air (PAM/Tanah)", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Housing", "bucket": "NEEDS", "color": "bg-cyan-600", "icon": "💧" },
  { "name": "Gas Elpiji / PGN", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Housing", "bucket": "NEEDS", "color": "bg-orange-500", "icon": "🔥" },
  { "name": "Internet & WiFi", "type": "EXPENSE", "flexibility": "FIXED", "group": "Housing", "bucket": "NEEDS", "color": "bg-sky-500", "icon": "🌐" },
  { "name": "Maintenance Rumah", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Housing", "bucket": "NEEDS", "color": "bg-stone-500", "icon": "🛠" },
  { "name": "Laundry & Kebersihan", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Housing", "bucket": "WANTS", "color": "bg-teal-400", "icon": "🧺" },

  // --- GROUP: TRANSPORT ---
  { "name": "Cicilan Kendaraan", "type": "EXPENSE", "flexibility": "FIXED", "group": "Transport", "bucket": "NEEDS", "color": "bg-blue-700", "icon": "🚘" },
  { "name": "Bensin / BBM", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Transport", "bucket": "NEEDS", "color": "bg-blue-500", "icon": "⛽️" },
  { "name": "Ojol / Taxi Online", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Transport", "bucket": "NEEDS", "color": "bg-green-600", "icon": "🛵" },
  { "name": "Tol & Parkir", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Transport", "bucket": "NEEDS", "color": "bg-slate-500", "icon": "🅿️" },
  { "name": "Servis & Pajak", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Transport", "bucket": "NEEDS", "color": "bg-zinc-600", "icon": "🔧" },

  // --- GROUP: FOOD ---
  { "name": "Belanja Bulanan (Groceries)", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Food", "bucket": "NEEDS", "color": "bg-amber-600", "icon": "🛒" },
  { "name": "Makan Harian (Kerja)", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Food", "bucket": "NEEDS", "color": "bg-orange-500", "icon": "🍱" },
  { "name": "Dining Out / Resto", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Food", "bucket": "WANTS", "color": "bg-rose-500", "icon": "🍽" },
  { "name": "Coffee & Snacks", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Food", "bucket": "WANTS", "color": "bg-amber-700", "icon": "☕️" },
  { "name": "Food Delivery (GoFood)", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Food", "bucket": "WANTS", "color": "bg-green-500", "icon": "🥡" },

  // --- GROUP: LIFESTYLE ---
  { "name": "Subscriptions (Netflix/Spotify)", "type": "EXPENSE", "flexibility": "FIXED", "group": "Lifestyle", "bucket": "WANTS", "color": "bg-red-600", "icon": "🎬" },
  { "name": "Skincare & Makeup", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Lifestyle", "bucket": "WANTS", "color": "bg-pink-400", "icon": "✨" },
  { "name": "Fashion (Baju/Sepatu)", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Lifestyle", "bucket": "WANTS", "color": "bg-purple-500", "icon": "👗" },
  { "name": "Barbershop / Salon", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Lifestyle", "bucket": "WANTS", "color": "bg-violet-500", "icon": "💇" },
  { "name": "Hobi & Mainan", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Lifestyle", "bucket": "WANTS", "color": "bg-indigo-500", "icon": "🎮" },
  { "name": "Liburan / Staycation", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Lifestyle", "bucket": "WANTS", "color": "bg-cyan-400", "icon": "✈️" },

  // --- GROUP: HEALTH ---
  { "name": "BPJS / Asuransi", "type": "EXPENSE", "flexibility": "FIXED", "group": "Health", "bucket": "NEEDS", "color": "bg-red-500", "icon": "🏥" },
  { "name": "Dokter & RS", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Health", "bucket": "NEEDS", "color": "bg-rose-400", "icon": "🩺" },
  { "name": "Obat & Vitamin", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Health", "bucket": "NEEDS", "color": "bg-green-400", "icon": "💊" },
  { "name": "Gym / Fitness", "type": "EXPENSE", "flexibility": "FIXED", "group": "Health", "bucket": "WANTS", "color": "bg-teal-500", "icon": "💪" },

  // --- GROUP: EDUCATION & GADGET ---
  { "name": "Buku & Kursus Online", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Education", "bucket": "WANTS", "color": "bg-blue-400", "icon": "📚" },
  { "name": "Software Subs (Adobe/ChatGPT)", "type": "EXPENSE", "flexibility": "FIXED", "group": "Education", "bucket": "NEEDS", "color": "bg-sky-600", "icon": "💻" },
  { "name": "Gadget & Elektronik", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Education", "bucket": "WANTS", "color": "bg-zinc-700", "icon": "📱" },

  // --- GROUP: DEBT ---
  { "name": "Tagihan Kartu Kredit", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Debt", "bucket": "WANTS", "color": "bg-slate-700", "icon": "💳" },
  { "name": "Paylater / Pinjol", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Debt", "bucket": "WANTS", "color": "bg-gray-600", "icon": "💸" },
  { "name": "Utang Pribadi (Teman)", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Debt", "bucket": "NEEDS", "color": "bg-neutral-500", "icon": "🤝" },

  // --- GROUP: SOCIAL ---
  { "name": "Bantuan Ortu / Mertua", "type": "EXPENSE", "flexibility": "FIXED", "group": "Social", "bucket": "NEEDS", "color": "bg-indigo-600", "icon": "👨‍👩‍👧" },
  { "name": "Kondangan & Kado", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Social", "bucket": "WANTS", "color": "bg-pink-600", "icon": "🎁" },
  { "name": "Sedekah / Zakat", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Social", "bucket": "WANTS", "color": "bg-emerald-700", "icon": "🤲" },
  { "name": "Piutang (Pinjemin Orang)", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Social", "bucket": "WANTS", "color": "bg-gray-400", "icon": "💸" },

  // --- GROUP: FAMILY ---
  { "name": "Belanja Keperluan Anak", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Family", "bucket": "NEEDS", "color": "bg-yellow-400", "icon": "👶" },
  { "name": "SPP Sekolah / Les", "type": "EXPENSE", "flexibility": "FIXED", "group": "Family", "bucket": "NEEDS", "color": "bg-blue-500", "icon": "🎒" },
  { "name": "Makanan Hewan / Petshop", "type": "EXPENSE", "flexibility": "VARIABLE", "group": "Family", "bucket": "WANTS", "color": "bg-orange-700", "icon": "🐱" }
];

export async function POST() {
  try {
    await dbConnect();
    
    // Force Schema Update (Hot-fix for Next.js dev mode model caching)
    if (!Category.schema.path("group")) {
        Category.schema.add({ 
            group: { type: String }, 
            bucket: { type: String, enum: ["NEEDS", "WANTS", "SAVINGS"] } 
        });
        // Re-compile model if needed? strict mode usually checks schema.
    }

    // Clear existing EXPENSE categories to avoid duplicates/confusion if restarting?
    // Or just upsert.
    // Let's upsert by name to be safe.
    
    const results = [];
    
    for (const cat of DEFAULT_CATEGORIES) {
        const result = await Category.findOneAndUpdate(
            { name: cat.name },
            { 
                ...cat,
                isDeleted: false 
            },
            { upsert: true, new: true }
        );
        results.push(result);
    }

    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error("Seeding failed:", error);
    return NextResponse.json({ error: "Seeding failed" }, { status: 500 });
  }
}
