import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb";
import { MongoClient } from "mongodb";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise as Promise<MongoClient>),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "ADAM or SASTI" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const creds = credentials as Record<string, string>;
        if (!creds?.username || !creds?.password) {
            return null;
        }

        await clientPromise; // Ensure DB connection is active (or rely on mongoose connect if elsewhere, but adapter handles it)
        // We need to use Mongoose model here, so let's import it or use native driver if adapter dominates.
        // Since we have User model, let's try to use it. But we need to ensure mongoose connection.
        // The adapter uses `clientPromise`, which is native MongoClient.
        // Let's use the native client for auth check to avoid double connection logic issues, or just use mongoose if we are sure.
        // Actually, mixing mongoose and native client in NextAuth is fine but let's stick to one if possible.
        // However, we just used Mongoose in seed. Let's use Mongoose in `authorize` but we must ensure `dbConnect` is called.

        try {
            // Check if mongoose is connected, if not connect
            const mongoose = (await import("mongoose")).default;
            if (mongoose.connection.readyState !== 1) {
                 const { default: dbConnect } = await import("./db");
                 await dbConnect();
            }
             
            const User = (await import("@/models/User")).default;
            const bcrypt = (await import("bcryptjs")).default;

            const user = await User.findOne({ username: creds.username.toUpperCase() });

            if (!user) {
                return null;
            }

            // If password has hash (it should), compare.
            // If legacy user without password (not possible with new seed), handle? 
            // We assume seed ran.
            // If password has hash (it should), compare.
            // If legacy user without password (not possible with new seed), handle? 
            // We assume seed ran.
            if (user.password) {
                 const isValid = await bcrypt.compare(creds.password, user.password);
                 if (!isValid) return null;
            } else {
                return null; // Force password usage
            }

            // Fallback for ADAM if role is not set yet in DB
            let role = user.role || "USER";
            if (user.username === "ADAM") {
                role = "ADMIN";
            }

            return { 
                id: user._id.toString(), 
                name: user.name, 
                // Return username explicitly for callbacks
                username: user.username,
                email: `${user.username.toLowerCase()}@dams.com`, 
                image: null,
                role: role,
            };
        } catch (e) {
            console.error("Auth error:", e);
            return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Credentials provider requires JWT strategy usually
    maxAge: 86400, // 24 hours
  },
  callbacks: {
      async jwt({ token, user }) {
        if (user) {
            token.role = user.role;
            token.sub = user.id;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            token.username = (user as any).username;
        }
        return token;
      },
      async session({ session, token }) {
          if (session.user && token.sub) {
              // Ensure user ID is available in session
              session.user.id = token.sub; 
              session.user.role = token.role as string;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (session.user as any).username = token.username;
          }
          return session;
      }
  },
  pages: {
      signIn: '/auth/signin', // We will build a custom page later or use default for now
  }
};
