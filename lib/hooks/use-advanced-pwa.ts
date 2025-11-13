// lib/hooks/use-advanced-pwa.ts
"use client";

import { useState, useEffect } from "react";

// 1. OFFLINE FUNCTIONALITY & BACKGROUND SYNC
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const queueAction = (action: any) => {
    if (isOnline) {
      return executeAction(action);
    } else {
      setPendingActions((prev) => [...prev, action]);
      storeOfflineAction(action);
    }
  };

  const executeAction = async (action: any) => {
    console.log("Executing action:", action);
  };

  const storeOfflineAction = (action: any) => {
    const stored = JSON.parse(localStorage.getItem("offline_actions") || "[]");
    stored.push(action);
    localStorage.setItem("offline_actions", JSON.stringify(stored));
  };

  return { isOnline, queueAction, pendingActions };
}

// 2. APP ICON BADGING
export function useAppBadge() {
  const setBadge = (count: number) => {
    if ("setAppBadge" in navigator) {
      (navigator as any).setAppBadge(count);
    }
  };

  const clearBadge = () => {
    if ("clearAppBadge" in navigator) {
      (navigator as any).clearAppBadge();
    }
  };

  return { setBadge, clearBadge };
}

// 3. DEVICE VIBRATION
export function useVibration() {
  const vibrate = (pattern: number | number[]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const patterns = {
    success: [100],
    error: [100, 50, 100],
    notification: [200, 100, 200],
    booking: [300, 100, 300, 100, 300],
  };

  const vibratePattern = (type: keyof typeof patterns) => {
    vibrate(patterns[type]);
  };

  return { vibrate, vibratePattern };
}

// 4. WEB SHARE API
export function useWebShare() {
  const canShare = "share" in navigator;

  const shareProvider = async (provider: any) => {
    if (!canShare) return false;

    try {
      await navigator.share({
        title: `${provider.name} - LiberiaFix`,
        text: `Check out ${
          provider.name
        } on LiberiaFix - ${provider.services.join(", ")}`,
        url: `${window.location.origin}/providers/${provider.id}`,
      });
      return true;
    } catch (error) {
      console.log("Share cancelled or failed");
      return false;
    }
  };

  const shareApp = async () => {
    if (!canShare) return false;

    try {
      await navigator.share({
        title: "LiberiaFix - Find Local Services",
        text: "Find trusted service providers in Liberia with LiberiaFix",
        url: window.location.origin,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  return { canShare, shareProvider, shareApp };
}

// 5. BIOMETRIC AUTHENTICATION
export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    if ("credentials" in navigator && "create" in navigator.credentials) {
      try {
        const available = await (navigator.credentials as any).get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: "preferred",
          },
        });
        setIsSupported(true);
        setIsEnrolled(!!available);
      } catch (error) {
        setIsSupported(false);
      }
    }
  };

  const authenticate = async () => {
    if (!isSupported) return false;

    try {
      const credential = await (navigator.credentials as any).get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required",
        },
      });
      return !!credential;
    } catch (error) {
      return false;
    }
  };

  return { isSupported, isEnrolled, authenticate };
}

// 6. DARK MODE SUPPORT
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return { isDark, setIsDark };
}

// 7. FULLSCREEN API HOOK
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = async (element?: Element) => {
    const target = element || document.documentElement;

    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.log("Fullscreen failed:", error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.log("Exit fullscreen failed:", error);
    }
  };

  return { isFullscreen, enterFullscreen, exitFullscreen };
}

// 8. CONTACT PICKER API HOOK
export function useContactPicker() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("contacts" in navigator && "ContactsManager" in window);
  }, []);

  const selectContact = async () => {
    if (!isSupported) return null;

    try {
      const contacts = await (navigator as any).contacts.select(
        ["name", "tel"],
        { multiple: false }
      );
      return contacts[0] || null;
    } catch (error) {
      return null;
    }
  };

  return { isSupported, selectContact };
}
