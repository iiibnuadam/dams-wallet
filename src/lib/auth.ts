import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
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

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/auth/login`, {
              method: "POST",
              body: JSON.stringify({
                username: creds.username,
                password: creds.password,
              }),
              headers: { "Content-Type": "application/json" }
            });

            const result = await res.json();

            if (res.ok && result.code === 200 && result.data?.token) {
              const { token, user } = result.data;
              return {
                id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                accessToken: token,
              };
            }

            return null;
        } catch (e) {
            console.error("Auth error:", e);
            return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days matches backend JWT expiry
  },
  callbacks: {
      async jwt({ token, user }) {
        if (user) {
            token.sub = user.id;
            token.role = (user as any).role;
            token.username = (user as any).username;
            token.accessToken = (user as any).accessToken;
        }
        return token;
      },
      async session({ session, token }) {
          if (session.user && token.sub) {
              session.user.id = token.sub; 
              session.user.role = token.role as string;
              (session.user as any).username = token.username;
              (session.user as any).accessToken = token.accessToken;
          }
          return session;
      }
  },
  pages: {
      signIn: '/auth/signin', // We will build a custom page later or use default for now
  }
};
