// lib/utils/sw-cleanup.ts
// Run this once to clear the old service worker

export async function unregisterOldServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        console.log("Unregistering old service worker...");
        await registration.unregister();
      }

      // Clear all caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        console.log("Deleting cache:", cacheName);
        await caches.delete(cacheName);
      }

      console.log("✅ All service workers and caches cleared!");
      console.log("🔄 Reloading page...");

      // Reload to register new service worker
      window.location.reload();
    } catch (error) {
      console.error("Error cleaning up service worker:", error);
    }
  }
}

// Call this function once from your browser console or add it to your app temporarily
// Then remove it after the cleanup
if (typeof window !== "undefined") {
  (window as any).cleanupServiceWorker = unregisterOldServiceWorker;
}
