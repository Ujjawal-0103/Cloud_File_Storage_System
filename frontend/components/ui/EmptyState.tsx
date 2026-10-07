import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const label = actionLabel || actionText;

  return (
    <div
      className={cn(
        "py-12 px-4 text-center bg-slate-50/70 rounded-2xl border border-slate-200/80 border-dashed max-w-2xl mx-auto flex flex-col items-center justify-center my-4",
        className,
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-500 mb-3.5">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>

      {label && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <span>{label}</span>
        </Link>
      )}

      {label && !actionHref && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <span>{label}</span>
        </button>
      )}
    </div>
  );
}
