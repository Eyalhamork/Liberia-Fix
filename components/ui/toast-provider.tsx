// components/ui/toast-provider.tsx
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface Toast {
  id: string;
  title?: string;
  description: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: {
    success: (description: string, title?: string) => void;
    error: (description: string, title?: string) => void;
    warning: (description: string, title?: string) => void;
    info: (description: string, title?: string) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (description: string, title?: string) =>
      addToast({ type: "success", description, title }),
    error: (description: string, title?: string) =>
      addToast({ type: "error", description, title }),
    warning: (description: string, title?: string) =>
      addToast({ type: "warning", description, title }),
    info: (description: string, title?: string) =>
      addToast({ type: "info", description, title }),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconColors = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-yellow-500",
    info: "text-blue-500",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`
      ${colors[toast.type]}
      border rounded-lg p-4 shadow-lg backdrop-blur-sm 
      animate-slide-in transform transition-all duration-300
      hover:shadow-xl
    `}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`h-5 w-5 ${iconColors[toast.type]} flex-shrink-0 mt-0.5`}
        />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="font-semibold text-sm mb-1">{toast.title}</p>
          )}
          <p className="text-sm">{toast.description}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Alternative context-free toast function for use outside components
let toastFunction: ToastContextType["toast"] | null = null;

export function setToastFunction(toast: ToastContextType["toast"]) {
  toastFunction = toast;
}

export const toast = {
  success: (description: string, title?: string) =>
    toastFunction?.success(description, title),
  error: (description: string, title?: string) =>
    toastFunction?.error(description, title),
  warning: (description: string, title?: string) =>
    toastFunction?.warning(description, title),
  info: (description: string, title?: string) =>
    toastFunction?.info(description, title),
};

// CSS for animations (add to globals.css)
export const toastStyles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

// Hook the toast function to the provider
export function ToastProviderWithFunction({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ToastFunctionSetter>{children}</ToastFunctionSetter>
    </ToastProvider>
  );
}

function ToastFunctionSetter({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  React.useEffect(() => {
    setToastFunction(toast);
  }, [toast]);

  return <>{children}</>;
}
