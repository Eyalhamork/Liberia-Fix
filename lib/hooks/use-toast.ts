// lib/hooks/use-toast.ts
"use client";

import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title?: string;
  description: string;
  type: ToastType;
  duration?: number;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    ({
      title,
      description,
      type = "info",
      duration = 5000,
    }: Omit<Toast, "id"> & { duration?: number }) => {
      const id = (++toastId).toString();
      const toast = { id, title, description, type, duration };

      setToasts((prev) => [...prev, toast]);

      // Auto remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (props: Omit<Toast, "id"> & { duration?: number }) => {
      return addToast(props);
    },
    [addToast]
  );

  // Convenience methods
  const success = useCallback(
    (description: string, title?: string, duration?: number) => {
      return addToast({ title, description, type: "success", duration });
    },
    [addToast]
  );

  const error = useCallback(
    (description: string, title?: string, duration?: number) => {
      return addToast({ title, description, type: "error", duration });
    },
    [addToast]
  );

  const warning = useCallback(
    (description: string, title?: string, duration?: number) => {
      return addToast({ title, description, type: "warning", duration });
    },
    [addToast]
  );

  const info = useCallback(
    (description: string, title?: string, duration?: number) => {
      return addToast({ title, description, type: "info", duration });
    },
    [addToast]
  );

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    removeToast,
  };
}
