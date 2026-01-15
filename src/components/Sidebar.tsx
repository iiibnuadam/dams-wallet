import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_LINKS } from "@/lib/nav-config";
import { 
 
  User, 
  LogOut, 
  Moon, 
  Sun,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { ProfileDialog } from "@/components/ProfileDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
    collapsed: boolean;
    toggle: () => void;
}

export function Sidebar({ collapsed, toggle }: SidebarProps) {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  // Filter links based on user role
  const role = session?.user?.role || "USER";
  const links = NAV_LINKS.filter(link => !link.roles || link.roles.includes(role as any));

  if (!mounted) return null;


  const NavItem = ({ link }: { link: typeof links[0] }) => (
      <Link
        href={link.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group",
          isActive(link.href)
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          collapsed && "justify-center px-0"
        )}
      >
        <link.icon className={cn("flex-shrink-0 transition-all duration-300", collapsed ? "w-6 h-6" : "w-5 h-5")} />
        <span className={cn(
            "whitespace-nowrap overflow-hidden transition-all duration-300",
            collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"
        )}>
            {link.label}
        </span>
      </Link>
  );

  return (
    <>
      <aside 
        className={cn(
            "hidden lg:flex flex-col h-screen fixed left-0 top-0 border-r bg-background/95 backdrop-blur z-50 transition-all duration-300 ease-in-out",
            collapsed ? "w-[70px]" : "w-64"
        )}
      >
        {/* Logo Area */}
        <div className={cn("h-16 flex items-center border-b transition-all duration-300", collapsed ? "justify-center px-0" : "px-6 justify-between")}>
           <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary overflow-hidden whitespace-nowrap">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                 <Image src="/icon-192.png" alt="Dams Wallet" fill className="object-cover" />
              </div>
              <span className={cn(
                  "text-foreground transition-all duration-300 overflow-hidden",
                  collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 ml-2"
              )}>Dams Wallet</span>
            </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-x-hidden">
          <TooltipProvider delayDuration={0}>
              {links.map((link) => (
                collapsed ? (
                    <Tooltip key={link.href}>
                        <TooltipTrigger asChild>
                            <div><NavItem link={link} /></div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-semibold">
                            {link.label}
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <NavItem key={link.href} link={link} />
                )
              ))}
          </TooltipProvider>
        </div>

        {/* Bottom Section: Theme & User */}
        <div className="p-3 border-t space-y-4">
            
            {/* Toggle Button */}
            <div className={cn("flex items-center transition-all duration-300", collapsed ? "justify-center" : "justify-end")}>
                 <Button variant="ghost" size="icon" onClick={toggle} className="h-6 w-6 text-muted-foreground">
                     {collapsed ? <ChevronRight className="w-4 h-4"/> : <PanelLeftClose className="w-4 h-4" />}
                 </Button>
            </div>

             {/* Theme Toggle */}
             <div className="w-full">
                {collapsed ? (
                    <div className="flex justify-center">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-muted-foreground hover:text-foreground relative overflow-hidden" 
                            onClick={(e) => {
                                const newTheme = theme === 'dark' ? 'light' : 'dark';
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                if (!(document as any).startViewTransition) {
                                    setTheme(newTheme);
                                    return;
                                }

                                const x = e.nativeEvent.clientX;
                                const y = e.nativeEvent.clientY;
                                const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const transition = (document as any).startViewTransition(() => setTheme(newTheme));

                                transition.ready.then(() => {
                                    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
                                    document.documentElement.animate(
                                        { clipPath },
                                        { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
                                    );
                                });
                            }}
                        >
                             <Sun className="h-5 w-5 transition-all duration-500 ease-[var(--ease-bouncy)] translate-y-0 opacity-100 dark:-translate-y-full dark:opacity-0" />
                             <Moon className="absolute h-5 w-5 transition-all duration-500 ease-[var(--ease-bouncy)] translate-y-full opacity-0 dark:translate-y-0 dark:opacity-100" />
                             <span className="sr-only">Toggle theme</span>
                        </Button>
                    </div>
                ) : (
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start px-3 py-2.5 gap-3 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                            const newTheme = theme === 'dark' ? 'light' : 'dark';
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            if (!(document as any).startViewTransition) {
                                setTheme(newTheme);
                                return;
                            }

                            const x = e.nativeEvent.clientX;
                            const y = e.nativeEvent.clientY;
                            const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const transition = (document as any).startViewTransition(() => setTheme(newTheme));

                            transition.ready.then(() => {
                                const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
                                document.documentElement.animate(
                                    { clipPath },
                                    { duration: 1000, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
                                );
                            });
                        }}
                    >
                         <div className="flex items-center justify-center w-5 h-5 relative overflow-hidden">
                             <Sun className="h-5 w-5 transition-all duration-500 ease-[var(--ease-bouncy)] translate-y-0 opacity-100 dark:-translate-y-full dark:opacity-0" />
                             <Moon className="absolute h-5 w-5 transition-all duration-500 ease-[var(--ease-bouncy)] translate-y-full opacity-0 dark:translate-y-0 dark:opacity-100" />
                         </div>
                         <span className="font-medium">Theme</span>
                    </Button>
                )}
             </div>

             {/* User Profile */}
             {session ? (
                 collapsed ? (
                    <div className="flex flex-col gap-2 items-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setProfileOpen(true)} className="h-10 w-10 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors">
                                    <User className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Profile Settings</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Logout</TooltipContent>
                        </Tooltip>
                    </div>
                 ) : (
                    <div className="flex flex-col gap-1">
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start px-2 py-6 hover:bg-muted/50" 
                            onClick={() => setProfileOpen(true)}
                        >
                            <div className="flex items-center gap-3 w-full text-left">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate">{session.user?.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">Edit Profile</p>
                                </div>
                                <Settings className="h-4 w-4 text-muted-foreground opacity-50" />
                            </div>
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50/50"
                            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                 )
             ) : (
                <Button asChild className={cn("w-full", collapsed && "p-0")} variant={collapsed ? "ghost" : "default"}>
                    <Link href="/auth/signin">
                        {collapsed ? <LogOut className="w-4 h-4"/> : "Sign In"}
                    </Link>
                </Button>
             )}
        </div>
      </aside>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
