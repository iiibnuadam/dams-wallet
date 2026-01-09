"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e?: React.FormEvent, customProfile?: { u: string, p: string }) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    const userToLogin = customProfile?.u || username;
    const passToLogin = customProfile?.p || password;

    if (!userToLogin || !passToLogin) {
      setError("Please enter username and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        username: userToLogin,
        password: passToLogin,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
                <div className="p-3 bg-primary/10 rounded-full">
                    <Wallet className="w-6 h-6 text-primary" />
                </div>
            </div>
          <CardTitle className="text-2xl">Dams Wallet</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="ADAM or SASTI"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Quick Access (Dev)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => handleSignIn(undefined, { u: "ADAM", p: "adam123" })}
            >
              ADAM
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => handleSignIn(undefined, { u: "SASTI", p: "sasti123" })}
            >
              SASTI
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center mt-4">
           <p className="text-xs text-muted-foreground text-center px-4">
             Note: Ensure you seeded data with passwords.
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}
