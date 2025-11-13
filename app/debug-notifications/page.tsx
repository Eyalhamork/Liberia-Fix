// app/debug-notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugNotificationsPage() {
  const [swStatus, setSwStatus] = useState<string>("Checking...");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<string>("Checking...");
  const [permissionStatus, setPermissionStatus] =
    useState<string>("Checking...");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
    console.log(message);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    // Check service worker
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        setSwStatus(
          `✅ Registered (state: ${registration.active?.state || "pending"})`
        );
      } else {
        setSwStatus("❌ Not registered");
      }
    } else {
      setSwStatus("❌ Not supported");
    }

    // Check permission
    if ("Notification" in window) {
      setPermissionStatus(`${Notification.permission}`);
    }

    // Check subscription
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setSubscriptionStatus("✅ Subscribed");
        } else {
          setSubscriptionStatus("❌ Not subscribed");
        }
      } catch (error) {
        setSubscriptionStatus(`❌ Error: ${error}`);
      }
    }
  };

  const unregisterServiceWorker = async () => {
    addLog("Unregistering service worker...");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        addLog("✅ Service worker unregistered");
        setSwStatus("❌ Not registered");
      } else {
        addLog("No service worker to unregister");
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const registerServiceWorker = async () => {
    addLog("Registering service worker...");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      addLog("✅ Service worker registered");
      await navigator.serviceWorker.ready;
      addLog("✅ Service worker ready");
      setSwStatus("✅ Registered");
      await checkStatus();
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const clearCaches = async () => {
    addLog("Clearing caches...");
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      addLog(`✅ Cleared ${cacheNames.length} caches`);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const fullReset = async () => {
    addLog("=== Starting full reset ===");
    await unregisterServiceWorker();
    await clearCaches();
    addLog("Waiting 2 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await registerServiceWorker();
    addLog("=== Reset complete ===");
  };

  const requestPermission = async () => {
    addLog("Requesting notification permission...");
    try {
      const permission = await Notification.requestPermission();
      addLog(`Permission: ${permission}`);
      setPermissionStatus(permission);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const testPushSubscription = async () => {
    addLog("Testing push subscription...");
    try {
      const registration = await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        addLog("❌ VAPID key not found in env");
        return;
      }

      addLog("VAPID key found");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      addLog("✅ Push subscription created");
      addLog(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      setSubscriptionStatus("✅ Subscribed");
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">🔧 Notification System Debug</h1>

      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Service Worker:</strong> {swStatus}
            </div>
            <div>
              <strong>Permission:</strong> {permissionStatus}
            </div>
            <div>
              <strong>Subscription:</strong> {subscriptionStatus}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button onClick={fullReset} variant="destructive">
                🔄 Full Reset (Recommended)
              </Button>
              <Button onClick={checkStatus} variant="outline">
                🔍 Check Status
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={unregisterServiceWorker}
                variant="outline"
                size="sm"
              >
                Unregister SW
              </Button>
              <Button
                onClick={registerServiceWorker}
                variant="outline"
                size="sm"
              >
                Register SW
              </Button>
              <Button onClick={clearCaches} variant="outline" size="sm">
                Clear Caches
              </Button>
              <Button onClick={requestPermission} variant="outline" size="sm">
                Request Permission
              </Button>
              <Button
                onClick={testPushSubscription}
                variant="outline"
                size="sm"
              >
                Test Subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Replace{" "}
                <code className="bg-gray-100 px-1 rounded">public/sw.js</code>{" "}
                with the new fixed version
              </li>
              <li>Click "🔄 Full Reset" button above</li>
              <li>Wait for all steps to complete</li>
              <li>Refresh this page (Ctrl+Shift+R / Cmd+Shift+R)</li>
              <li>Go back to test page and try "Enable Notifications"</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
