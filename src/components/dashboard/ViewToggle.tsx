"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletOwner } from "@/types/wallet";

interface ViewToggleProps {
  defaultView?: string;
}

export function ViewToggle({ defaultView = "ALL" }: ViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || defaultView;

  const onViewChange = (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      // Always set the view param, even for ALL, so it overrides the server-side default
      params.set("view", value);
      router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={currentView} onValueChange={onViewChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="ALL">All / Joint</TabsTrigger>
        <TabsTrigger value={WalletOwner.ADAM}>{WalletOwner.ADAM}</TabsTrigger>
        <TabsTrigger value={WalletOwner.SASTI}>{WalletOwner.SASTI}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
