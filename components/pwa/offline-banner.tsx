// components/pwa/offline-banner.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" message briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);

      if ("vibrate" in navigator) {
        navigator.vibrate([30, 10, 30]);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);

      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    };

    // Set initial state
    setIsOnline(navigator.onLine);
    setShowBanner(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-[9999] safe-top"
        >
          <div
            className={`px-4 py-3 text-sm font-medium text-white flex items-center justify-center gap-2 ${
              isOnline ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                Back Online
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                No Internet Connection
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
