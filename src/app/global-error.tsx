"use client";

import { useEffect } from "react";

// Catches errors thrown by the root layout itself (Navbar/Shell/providers),
// which app/error.tsx cannot -- it replaces the entire <html>/<body>, so it
// must stay minimal and self-contained (no shared layout components).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root-layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-50 antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Dams Wallet gagal dimuat</h2>
            <p className="text-sm text-zinc-400 max-w-sm">
              Terjadi kesalahan saat memuat aplikasi. Coba muat ulang halaman.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
