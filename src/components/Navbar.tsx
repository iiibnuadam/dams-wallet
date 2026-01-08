"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Wallet, User } from "lucide-react"
import { ProfileDialog } from "@/components/ProfileDialog"

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
          <div className="bg-primary text-primary-foreground p-1 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <span>Dams Wallets</span>
        </div>

        {/* Mobile Header: Links Removed, Sidebar handles Desktop Nav */}
        <div className="flex-1" />

        <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
        </div>
      </div>
    </nav>
  )
}
