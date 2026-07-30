"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-rose-500" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Ada yang salah</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Terjadi kesalahan saat memuat halaman ini. Biasanya karena koneksi ke server sempat gagal -- coba lagi.
        </p>
      </div>
      <Button onClick={() => reset()}>Coba Lagi</Button>
    </div>
  );
}
