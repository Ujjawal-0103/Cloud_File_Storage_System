import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load content from the cloud. Please check your connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "py-10 px-6 text-center bg-red-50/50 rounded-2xl border border-red-200/80 max-w-xl mx-auto flex flex-col items-center justify-center my-6",
        className,
      )}
    >
      <div className="h-11 w-11 rounded-2xl bg-white border border-red-200 shadow-xs flex items-center justify-center text-red-500 mb-3">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
