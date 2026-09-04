"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
          },
        }}
      />
    </SessionProvider>
  );
}
