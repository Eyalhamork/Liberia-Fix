"use client";

import { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { usePathname } from "next/navigation";

interface AppLayoutWrapperProps {
  children: ReactNode;
}

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname();

  // Pages that should not have bottom nav
  const hideBottomNav =
    pathname?.startsWith("/welcome") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/admin") ||
    pathname?.includes("/onboarding");

  return (
    <>
      {/* Main content with page transitions */}
      <main className={hideBottomNav ? "" : "with-bottom-nav"}>
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Bottom navigation (only shown on appropriate pages) */}
      <BottomNav />
    </>
  );
}
