// lib/hooks/use-pwa-install.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  // Install prompt state
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalling: boolean;

  // Device detection
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isStandalone: boolean;

  // User preferences
  hasBeenDismissed: boolean;
  canShowPrompt: boolean;

  // Actions
  triggerInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
  resetDismissal: () => void;
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Device detection
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroidDevice = /Android/.test(userAgent);
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );

    // Check if running in standalone mode (already installed)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);
    setIsStandalone(isStandaloneMode);

    // Check dismissal status
    const dismissedTime = localStorage.getItem("pwa-dismissed");
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const isDismissed = dismissedTime && parseInt(dismissedTime) > oneDayAgo;
    setHasBeenDismissed(!!isDismissed);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("PWA: Before install prompt event fired");
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("PWA: App was installed");
      localStorage.setItem("pwa-installed", "true");
      localStorage.removeItem("pwa-dismissed");
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);

      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent("pwa-installed"));
    };

    // Listen for display mode changes
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn("PWA: No deferred prompt available");
      return false;
    }

    try {
      setIsInstalling(true);

      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`PWA: User choice - ${outcome}`);

      if (outcome === "accepted") {
        localStorage.setItem("pwa-installed", "true");
        localStorage.removeItem("pwa-dismissed");
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error("PWA: Error triggering install:", error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem("pwa-dismissed", Date.now().toString());
    setHasBeenDismissed(true);
  }, []);

  const resetDismissal = useCallback(() => {
    localStorage.removeItem("pwa-dismissed");
    setHasBeenDismissed(false);
  }, []);

  const canShowPrompt =
    !isStandalone &&
    !hasBeenDismissed &&
    isMobile &&
    localStorage.getItem("pwa-installed") !== "true";

  return {
    deferredPrompt,
    isInstallable,
    isInstalling,
    isIOS,
    isAndroid,
    isMobile,
    isStandalone,
    hasBeenDismissed,
    canShowPrompt,
    triggerInstall,
    dismissPrompt,
    resetDismissal,
  };
}
