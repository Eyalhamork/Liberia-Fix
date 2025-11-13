"use client";

import { useState, useEffect } from "react";
import { X, Download, Share, Smartphone } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isInstalled);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Don't show anything if already installed
    if (isInstalled) {
      return;
    }

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show banner after 10 seconds (reduced from 30)
      setTimeout(() => {
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        if (daysSince >= 7) {
          setShowBanner(true);
        }
      }, 10000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS, show banner after 10 seconds
    if (iOS && !isInstalled) {
      setTimeout(() => {
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        if (daysSince >= 7) {
          setShowBanner(true);
        }
      }, 10000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA installed");
      if ("vibrate" in navigator) {
        navigator.vibrate([30, 10, 30]);
      }
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    setShowBanner(false);
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  // Don't show anything if already installed
  if (isStandalone) return null;

  // Show banner (slides up from bottom)
  if (showBanner) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 animate-slide-up">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1 pt-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Install LiberiaFix
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Install for faster access and offline use
                </p>
              </div>
            </div>

            {/* iOS Instructions */}
            {isIOS && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2 font-medium">
                  To install on iPhone/iPad:
                </p>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
                  <li>
                    Tap Share button <Share className="w-4 h-4 inline" />
                  </li>
                  <li>Scroll and tap "Add to Home Screen"</li>
                  <li>Tap "Add"</li>
                </ol>
              </div>
            )}

            {/* Android Install Button */}
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-5 h-5" />
                Install App
              </button>
            )}

            {/* Benefits */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl mb-1">⚡</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Faster
                </p>
              </div>
              <div>
                <div className="text-2xl mb-1">📱</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  App-like
                </p>
              </div>
              <div>
                <div className="text-2xl mb-1">🔒</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Offline
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Always show floating install button (only if can install)
  if (deferredPrompt || isIOS) {
    return (
      <button
        onClick={deferredPrompt ? handleInstall : () => setShowBanner(true)}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2 transition-all hover:scale-110 group"
        title="Install App"
      >
        <Download className="w-5 h-5" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Install
        </span>
      </button>
    );
  }

  return null;
}
