"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletOwner } from "@/types/wallet";

export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "ALL";

  const onViewChange = (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "ALL") {
          params.delete("view");
      } else {
          params.set("view", value);
      }
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
