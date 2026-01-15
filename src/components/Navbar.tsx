"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, LogOut } from "lucide-react"
import Image from "next/image"
import { ProfileDialog } from "@/components/ProfileDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const { setTheme, theme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Wait for mount to avoid hydration mismatch for theme/auth
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 lg:hidden">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/icon-192.png" alt="Dams Wallet" fill className="object-cover" />
          </div>
          <span>Dams Wallets</span>
        </div>

        {/* Mobile Header: Links Removed, Sidebar handles Desktop Nav */}
        <div className="flex-1" />

        <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                    const newTheme = theme === 'dark' ? 'light' : 'dark';
                    
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (!(document as any).startViewTransition) {
                        setTheme(newTheme);
                        return;
                    }

                    const x = e.nativeEvent.clientX;
                    const y = e.nativeEvent.clientY;
                    const endRadius = Math.hypot(
                        Math.max(x, innerWidth - x),
                        Math.max(y, innerHeight - y)
                    );

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const transition = (document as any).startViewTransition(() => {
                        setTheme(newTheme);
                    });

                    transition.ready.then(() => {
                        const clipPath = [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${endRadius}px at ${x}px ${y}px)`,
                        ];
                        
                        document.documentElement.animate(
                            {
                                clipPath: clipPath,
                            },
                            {
                                duration: 1000,
                                easing: "ease-in-out",
                                pseudoElement: "::view-transition-new(root)",
                            }
                        );
                    });
                }}
                className="relative overflow-hidden" // Clip the sliding icons
            >
                {/* Sun: Slides up and out in dark mode */}
                <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-[var(--ease-bouncy)] translate-y-0 opacity-100 dark:-translate-y-full dark:opacity-0" />
                
                {/* Moon: Slides up and in from bottom in dark mode */}
                <Moon className="absolute h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-[var(--ease-bouncy)] translate-y-full opacity-0 dark:translate-y-0 dark:opacity-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>

            {session?.user && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setProfileOpen(true)}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                            <AvatarFallback>{session.user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                    </Button>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => signOut()}
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>

                    <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
                </>
            )}
        </div>
      </div>
    </nav>
  )
}
