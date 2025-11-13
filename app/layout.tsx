// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { SplashScreen } from "@/components/splash-screen";
import { AppLayoutWrapper } from "@/components/layout/app-layout-wrapper";
import { MobileToastProvider } from "@/components/ui/mobile-toast";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-registration";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PushNotificationInitializer } from "@/components/pwa/push-notification-initializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LiberiaFix - Find Trusted Service Providers",
  description: "Connect with verified service providers across Liberia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LiberiaFix",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <SplashScreen />
        <Providers>
          <ToastProvider>
            <AppLayoutWrapper>
              <ServiceWorkerRegistration />
              <OfflineBanner />
              <InstallPrompt />
              <PushNotificationInitializer />
              {children}
              <MobileToastProvider />
            </AppLayoutWrapper>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
