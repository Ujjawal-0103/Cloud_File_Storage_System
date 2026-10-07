"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Folder,
  Share2,
  Star,
  Trash2,
  Settings,
  Cloud,
  HardDrive,
  Clock,
} from "lucide-react";

const getAuthToken = () => {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_token=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 KB";
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const Sidebar = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);

  useEffect(() => {
    setMounted(true);
    const fetchStorage = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch("/api/backend/files/storage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStorageUsedBytes(data.usedBytes || 0);
        }
      } catch {
        // Silently keep default
      }
    };
    fetchStorage();
  }, [pathname]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "My Files",
      href: "/files",
      icon: Folder,
    },
    {
      name: "Recent",
      href: "/recent",
      icon: Clock,
    },
    {
      name: "Shared",
      href: "/shared",
      icon: Share2,
    },
    {
      name: "Favorites",
      href: "/favorites",
      icon: Star,
    },
    {
      name: "Trash",
      href: "/trash",
      icon: Trash2,
    },
  ];

  const totalCapacity = 15 * 1024 * 1024 * 1024; // 15 GB
  const usedPercent = Math.min(100, Math.max(storageUsedBytes > 0 ? 1 : 0, (storageUsedBytes / totalCapacity) * 100));

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none shrink-0 h-screen sticky top-0 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand / Logo */}
        <div className="h-16 px-5 flex items-center border-b border-sidebar-border shrink-0">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <Image
              src="/logo.png"
              alt="CloudRage"
              width={46}
              height={46}
              className="h-11 w-11 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
              priority
            />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-none">
                CloudRage
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide mt-1">
                Cloud Storage
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 flex-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                mounted &&
                (pathname === item.href ||
                  (item.href !== "/dashboard" && item.href !== "/" && pathname.startsWith(`${item.href}/`)));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-500/10 dark:text-blue-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-blue-600 dark:text-blue-400 shrink-0"
                        : "text-muted-foreground shrink-0"
                    }
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Area: Settings & Storage */}
      <div className="p-3 border-t border-sidebar-border space-y-3 shrink-0 bg-sidebar">
        {/* Settings link */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            mounted && pathname === "/settings"
              ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-500/10 dark:text-blue-400"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
          }`}
        >
          <Settings
            size={18}
            className={
              mounted && pathname === "/settings"
                ? "text-blue-600 dark:text-blue-400 shrink-0"
                : "text-muted-foreground shrink-0"
            }
          />
          <span>Settings</span>
        </Link>

        {/* Storage Usage Widget */}
        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-sidebar-border p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-foreground">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Storage</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {usedPercent < 0.1 ? "<0.1%" : `${usedPercent.toFixed(1)}%`}
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(1, usedPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{formatBytes(storageUsedBytes)}</span>
            <span>of 15.0 GB</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;