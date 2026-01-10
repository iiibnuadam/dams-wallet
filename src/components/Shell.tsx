"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

interface ShellProps {
    children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Optional: Load state from localStorage
        const savedState = localStorage.getItem("sidebar-collapsed");
        if (savedState) {
            setIsCollapsed(savedState === "true");
        }
    }, []);

    const toggle = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith("/auth");

    if (isAuthPage) {
        return <>{children}</>;
    }

    if (!mounted) {
        // Prevent hydration mismatch by rendering a default state layout (expanded or whatever)
        // Or just return children if we want to wait. 
        // Returning a layout with default expanded is safer for SEO and structure.
        return (
             <div className="flex min-h-screen">
               {/* <div className="hidden md:block w-64 h-screen" /> */}
               <div className={cn("hidden md:flex w-64 h-screen p-4 flex-col justify-between", isCollapsed ? "w-18" : "w-64")}>
                <div>
                  <Skeleton className="w-2/3 h-8 mb-4" />
                  <Skeleton className="h-1 w-full rounded-lg mb-4" />
                  <Skeleton className="h-8 w-full rounded-lg mb-2" />
                  <Skeleton className="h-8 w-full rounded-lg mb-2" />
                  <Skeleton className="h-8 w-full rounded-lg mb-2" />
                </div>
                <div>
                  <Skeleton className="h-1 w-full rounded-lg mb-4" />
                  <Skeleton className="h-8 w-2/3 rounded-lg mb-2" />
                  <Skeleton className="h-8 w-full rounded-lg mb-2" />
                  <Skeleton className="h-8 w-full rounded-lg mb-2" />
                </div>
              </div>
               <div className="flex-1 flex flex-col min-h-screen w-full md:w-auto">
                   {children}
               </div>
            </div>
        );
    }

    return (
         <div className="flex min-h-screen">
            <Sidebar collapsed={isCollapsed} toggle={toggle} />
            <div className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                 isCollapsed ? "lg:pl-[70px]" : "lg:pl-64"
            )}>
                 {children}
            </div>
         </div>
    );
}
