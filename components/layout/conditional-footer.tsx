// components/layout/conditional-footer.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Footer } from "./footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if device is mobile/tablet
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024); // tablet and below
    };

    // Check if running as PWA
    const checkPWA = () => {
      if (typeof window === "undefined") return false;
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://") ||
        window.location.search.includes("utm_source=pwa")
      );
    };

    checkMobile();
    setIsPWA(checkPWA());

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Don't show footer on any dashboard pages
  const isDashboard =
    pathname?.includes("/dashboard") ||
    pathname?.includes("/home") ||
    pathname?.includes("/provider/") ||
    pathname?.includes("/admin/") ||
    pathname?.includes("/account") ||
    pathname?.includes("/messages") ||
    pathname?.includes("/notifications");

  // Don't show footer on mobile/tablet devices when app is installed
  const shouldHideFooter = isDashboard || (isMobile && isPWA);

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
}
