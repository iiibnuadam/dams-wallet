"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

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
               <div className="hidden md:block w-64 h-screen" /> {/* Placeholder for sidebar */}
               <div className="flex-1 flex flex-col min-h-screen md:pl-64 w-full md:w-auto">
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
