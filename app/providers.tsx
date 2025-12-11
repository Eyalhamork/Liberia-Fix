// FILE 2: app/providers.tsx (create this file)
// ============================================
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/lib/providers/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // Data fresh for 2 minutes
            gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
            retry: 1, // Only retry once (for slow connections)
            refetchOnWindowFocus: false, // Don't refetch when switching tabs
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
