"use client";

import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SignOutModal({
  isOpen,
  onClose,
  onConfirm,
}: SignOutModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button on open for safe keyboard navigation
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-modal-title"
      aria-describedby="signout-modal-desc"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-popover border border-border p-6 shadow-2xl space-y-4 text-popover-foreground animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="signout-modal-title"
              className="text-base font-bold text-foreground leading-tight"
            >
              Sign out of CloudRage?
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Confirm your session termination
            </p>
          </div>
        </div>

        <p id="signout-modal-desc" className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to sign out of your account? You will need to sign in again to access your secure storage.
        </p>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-foreground bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
