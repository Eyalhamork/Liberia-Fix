// lib/utils/sw-register.ts

/**
 * Register the service worker for push notifications
 * @returns ServiceWorkerRegistration or null if not supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Check if running in browser and service workers are supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Workers not supported in this browser');
    return null;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always fetch latest service worker
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates to the service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available');
            
            // Optionally notify user about update
            if (window.confirm('A new version is available. Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      }
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service Worker is ready');

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister the service worker
 * @returns boolean indicating success
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Update the service worker
 */
export async function updateServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('Service Worker update check completed');
    }
  } catch (error) {
    console.error('Service Worker update failed:', error);
  }
}

/**
 * Check if service worker is registered and active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration?.active;
  } catch (error) {
    console.error('Error checking service worker status:', error);
    return false;
  }
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return (await navigator.serviceWorker.getRegistration()) || null;
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
}

/**
 * Send a message to the service worker
 */
export async function sendMessageToServiceWorker(message: any): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.active) {
      registration.active.postMessage(message);
    }
  } catch (error) {
    console.error('Error sending message to service worker:', error);
  }
}

/**
 * Clear all service worker caches
 */
export async function clearServiceWorkerCache(): Promise<void> {
  await sendMessageToServiceWorker({ type: 'CLEAR_CACHE' });
}
