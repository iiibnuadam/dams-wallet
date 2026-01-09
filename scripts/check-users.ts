
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
    const { default: dbConnect } = await import("@/lib/db");
    const { default: User } = await import("@/models/User");
    const { default: Wallet } = await import("@/models/Wallet");

    await dbConnect();
    console.log("Connected to DB");

    const users = await User.find({}).lean();
    console.log("Wallets found:", users.map(u => ({ id: u._id, username: u.username, name: u.name })));

    const wallets = await Wallet.find({}).lean();
    console.log("Wallets found:", wallets.map(w => ({ id: w._id, name: w.name, owner: w.owner })));
}

main().catch(console.error).finally(() => process.exit());
