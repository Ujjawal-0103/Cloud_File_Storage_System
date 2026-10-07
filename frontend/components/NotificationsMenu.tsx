"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Share2,
  FileText,
  Folder,
  Info,
  Loader2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  createdAt: string;
}

const getAuthToken = () => {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_token=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

export default function NotificationsMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/backend/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Silently ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch("/api/backend/notifications?page=1&limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Unable to load notifications");
      }

      const json = await res.json();
      setNotifications(json.data || []);
      if (typeof json.unread === "number") {
        setUnreadCount(json.unread);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load notifications";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll unread count periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnreadCount();
    }, 0);
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchNotifications();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const token = getAuthToken();
      if (!token) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch(`/api/backend/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      await fetch("/api/backend/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = getAuthToken();
      if (!token) return;

      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      await fetch(`/api/backend/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      fetchNotifications();
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    setIsOpen(false);

    // Navigate to related page if available
    if (item.type.startsWith("SHARE_")) {
      router.push("/shared");
    } else if (item.relatedEntityType === "FILE" || item.relatedEntityType === "FOLDER") {
      router.push("/files");
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.startsWith("SHARE_")) {
      return <Share2 className="h-4 w-4 text-blue-500" />;
    }
    if (type.includes("FOLDER")) {
      return <Folder className="h-4 w-4 text-amber-500" />;
    }
    if (type.includes("FILE")) {
      return <FileText className="h-4 w-4 text-emerald-500" />;
    }
    return <Info className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-background animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-popover border border-border shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-150 text-popover-foreground">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-border flex items-center justify-between bg-popover">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-foreground text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 font-semibold text-[11px]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center space-x-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Content / List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-red-500 text-xs">{error}</p>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-muted-foreground">
                <div className="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Bell className="h-5 w-5 opacity-40" />
                </div>
                <p className="font-semibold text-foreground">No notifications yet</p>
                <p className="text-[11px] leading-relaxed">
                  When you receive shared files or team updates, they&apos;ll show up here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 px-4 flex items-start space-x-3 transition-colors cursor-pointer group ${
                    !item.read
                      ? "bg-blue-50/60 dark:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/15"
                      : "hover:bg-muted/50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-background border border-border shrink-0 mt-0.5 shadow-2xs">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate leading-snug ${
                          !item.read
                            ? "font-bold text-foreground"
                            : "font-semibold text-muted-foreground"
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!item.read && (
                      <button
                        type="button"
                        onClick={(e) => markAsRead(item.id, e)}
                        title="Mark as read"
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => deleteNotification(item.id, e)}
                      title="Delete notification"
                      className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
