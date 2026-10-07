import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 bg-slate-200" />
        <Skeleton className="h-8 w-8 rounded-lg bg-slate-100" />
      </div>
      <Skeleton className="h-7 w-20 bg-slate-200" />
      <Skeleton className="h-3.5 w-32 bg-slate-100" />
    </div>
  );
}

export function FolderGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 animate-pulse shadow-xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-6 rounded-md bg-amber-100" />
            <Skeleton className="h-4 w-4 rounded-full bg-slate-100" />
          </div>
          <Skeleton className="h-4 w-3/4 bg-slate-200" />
          <Skeleton className="h-3 w-1/2 bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function FileTableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs animate-pulse">
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50/80 border-b border-slate-100 text-xs text-slate-400">
        <div className="col-span-6 sm:col-span-5 flex items-center space-x-3">
          <Skeleton className="h-4 w-4 rounded bg-slate-200" />
          <Skeleton className="h-3.5 w-24 bg-slate-200" />
        </div>
        <div className="hidden sm:block sm:col-span-3">
          <Skeleton className="h-3.5 w-20 bg-slate-200" />
        </div>
        <div className="hidden sm:block sm:col-span-2">
          <Skeleton className="h-3.5 w-16 bg-slate-200" />
        </div>
        <div className="col-span-6 sm:col-span-2 flex justify-end">
          <Skeleton className="h-3.5 w-12 bg-slate-200" />
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center"
          >
            <div className="col-span-6 sm:col-span-5 flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-100 shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <Skeleton className="h-4 w-3/4 bg-slate-200" />
                <Skeleton className="h-3 w-1/3 bg-slate-100 sm:hidden" />
              </div>
            </div>
            <div className="hidden sm:block sm:col-span-3">
              <Skeleton className="h-3.5 w-28 bg-slate-100" />
            </div>
            <div className="hidden sm:block sm:col-span-2">
              <Skeleton className="h-3.5 w-16 bg-slate-100" />
            </div>
            <div className="col-span-6 sm:col-span-2 flex justify-end space-x-1.5">
              <Skeleton className="h-7 w-7 rounded-lg bg-slate-100" />
              <Skeleton className="h-7 w-7 rounded-lg bg-slate-100" />
              <Skeleton className="h-7 w-7 rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden p-3 space-y-2.5 shadow-xs animate-pulse"
        >
          <Skeleton className="h-24 w-full rounded-lg bg-slate-100" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-4/5 bg-slate-200" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-12 bg-slate-100" />
              <Skeleton className="h-3 w-16 bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
