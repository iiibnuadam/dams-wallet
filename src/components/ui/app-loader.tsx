import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLoaderProps {
  className?: string; // Wrapper class
  text?: string;
  fullScreen?: boolean; // If true, takes up min-h-screen or similar
}

export function AppLoader({ className, text = "Loading...", fullScreen = false }: AppLoaderProps) {
  return (
    <div className={cn(
        "flex flex-col items-center justify-center gap-4 bg-background",
        fullScreen ? "min-h-[calc(100vh-4rem)] md:min-h-screen" : "py-12",
        className
    )}>
      <div className="relative">
        {/* Pulsing background effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        
        {/* Main Icon Container */}
        <div className="relative z-10 p-4 rounded-full bg-primary/10 text-primary">
          <Wallet className="w-12 h-12 animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-1 animate-pulse">
        <h3 className="text-lg font-semibold text-primary">Dams Wallet</h3>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
