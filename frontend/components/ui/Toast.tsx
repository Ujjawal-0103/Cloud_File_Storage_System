"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
  showToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = "info", title, duration = 3500 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, type, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (message: string, title?: string) =>
      showToast({ message, type: "success", title: title || "Success" }),
    error: (message: string, title?: string) =>
      showToast({ message, type: "error", title: title || "Error" }),
    info: (message: string, title?: string) =>
      showToast({ message, type: "info", title: title || "Note" }),
    warning: (message: string, title?: string) =>
      showToast({ message, type: "warning", title: title || "Warning" }),
  };

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-lg text-slate-800 transform transition-all duration-200 animate-in slide-in-from-top-2 fade-in"
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && (
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              {t.type === "error" && (
                <div className="h-7 w-7 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
              {t.type === "warning" && (
                <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              )}
              {t.type === "info" && (
                <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <Info className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              {t.title && <h4 className="text-xs font-semibold text-slate-900">{t.title}</h4>}
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{t.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
