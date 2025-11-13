// components/ui/mobile-toast.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast manager singleton
class ToastManager {
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private toasts: Toast[] = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(toast: Omit<Toast, "id">) {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, duration: 4000, ...toast };

    this.toasts.push(newToast);
    this.notify();

    // Haptic feedback
    if ("vibrate" in navigator) {
      const pattern = {
        success: [30],
        error: [50, 30, 50],
        warning: [40],
        info: [20],
      }[newToast.type];
      navigator.vibrate(pattern);
    }

    // Auto dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newToast.duration);
    }
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  dismissAll() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

// Toast UI component
export function MobileToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="mb-3 pointer-events-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-md mx-auto">
        <div className="flex items-start gap-3 p-4">
          {/* Icon */}
          <div className={`${colors[toast.type]} rounded-xl p-2 flex-shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {toast.message}
            </p>
            {toast.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {toast.description}
              </p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-2 hover:underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => toastManager.dismiss(toast.id)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        {toast.duration && toast.duration > 0 && (
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: toast.duration / 1000, ease: "linear" }}
            className={`h-1 ${colors[toast.type]}`}
          />
        )}
      </div>
    </motion.div>
  );
}

// Helper functions
export const toast = {
  success: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>
  ) => {
    toastManager.show({ type: "success", message, ...options });
  },

  error: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>
  ) => {
    toastManager.show({ type: "error", message, ...options });
  },

  warning: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>
  ) => {
    toastManager.show({ type: "warning", message, ...options });
  },

  info: (
    message: string,
    options?: Partial<Omit<Toast, "id" | "type" | "message">>
  ) => {
    toastManager.show({ type: "info", message, ...options });
  },

  dismiss: (id: string) => {
    toastManager.dismiss(id);
  },

  dismissAll: () => {
    toastManager.dismissAll();
  },
};

// Example usage:
// toast.success('Provider contacted successfully!');
// toast.error('Payment failed', { description: 'Please try again' });
// toast.info('New message received', {
//   action: { label: 'View', onClick: () => router.push('/messages') }
// });
