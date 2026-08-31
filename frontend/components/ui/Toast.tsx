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
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[rgba(22,27,48,0.95)] backdrop-blur-[20px] border shadow-[0_15px_40px_rgba(0,0,0,0.4)] text-white transform transition-all duration-300 animate-in slide-in-from-top-4 fade-in"
            style={{
              borderColor:
                t.type === "success"
                  ? "rgba(16, 185, 129, 0.4)"
                  : t.type === "error"
                  ? "rgba(239, 68, 68, 0.4)"
                  : t.type === "warning"
                  ? "rgba(245, 158, 11, 0.4)"
                  : "rgba(139, 92, 246, 0.4)",
              boxShadow:
                t.type === "success"
                  ? "0 0 20px rgba(16, 185, 129, 0.15)"
                  : t.type === "error"
                  ? "0 0 20px rgba(239, 68, 68, 0.15)"
                  : "0 0 20px rgba(139, 92, 246, 0.15)",
            }}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && (
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              {t.type === "error" && (
                <div className="h-8 w-8 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400 border border-red-500/30">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
              {t.type === "warning" && (
                <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              )}
              {t.type === "info" && (
                <div className="h-8 w-8 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center text-[#8B5CF6] border border-[#8B5CF6]/30">
                  <Info className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              {t.title && <h4 className="text-xs font-semibold text-white tracking-wide">{t.title}</h4>}
              <p className="text-xs text-[#B7C1D8] mt-0.5 leading-relaxed break-words">{t.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-[#7D879C] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
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
