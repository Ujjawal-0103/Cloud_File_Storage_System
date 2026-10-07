"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  FileImage,
  FileCode,
  Upload,
  FolderPlus,
  Download,
  Eye,
  Clock,
  ChevronRight,
  Loader2,
  X,
  Share2,
  Trash2,
  RefreshCw,
  TrendingUp,
  Activity,
  FileSpreadsheet,
  Film,
  Music,
  Star,
  AlertCircle,
} from "lucide-react";
import CreateFolderModal from "@/components/explorer/CreateFolderModal";
import ShareFileModal from "@/components/sharing/ShareFileModal";
import { useToast } from "@/components/ui/Toast";
import {
  getDashboard,
  downloadFileWithAnalytics,
  getAuthToken,
} from "@/lib/api/dashboard";
import { DashboardData, DashboardFile, DashboardActivity } from "@/types/dashboard";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Images: { bg: "bg-blue-50 text-blue-700", text: "text-blue-700", bar: "bg-blue-500" },
  Documents: { bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700", bar: "bg-emerald-500" },
  Videos: { bg: "bg-purple-50 text-purple-700", text: "text-purple-700", bar: "bg-purple-500" },
  Audio: { bg: "bg-pink-50 text-pink-700", text: "text-pink-700", bar: "bg-pink-500" },
  Code: { bg: "bg-amber-50 text-amber-700", text: "text-amber-700", bar: "bg-amber-500" },
  Other: { bg: "bg-slate-100 text-slate-700", text: "text-slate-700", bar: "bg-slate-400" },
};

function getFileIcon(category: string, mimeType = "") {
  const mime = mimeType.toLowerCase();
  if (category === "Images" || mime.includes("image")) {
    return <FileImage className="h-4 w-4 text-blue-600" />;
  }
  if (category === "Videos" || mime.includes("video")) {
    return <Film className="h-4 w-4 text-purple-600" />;
  }
  if (category === "Audio" || mime.includes("audio")) {
    return <Music className="h-4 w-4 text-pink-600" />;
  }
  if (category === "Code" || mime.includes("json") || mime.includes("javascript") || mime.includes("typescript")) {
    return <FileCode className="h-4 w-4 text-amber-600" />;
  }
  if (mime.includes("pdf")) {
    return <FileText className="h-4 w-4 text-red-600" />;
  }
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
  }
  return <FileText className="h-4 w-4 text-slate-600" />;
}

function getActivityIcon(action: string) {
  switch (action) {
    case "UPLOAD":
      return <Upload className="h-3 w-3 text-blue-600" />;
    case "DOWNLOAD":
      return <Download className="h-3 w-3 text-purple-600" />;
    case "CREATE_FOLDER":
    case "RENAME_FOLDER":
      return <FolderPlus className="h-3 w-3 text-amber-600" />;
    case "SHARE":
      return <Share2 className="h-3 w-3 text-emerald-600" />;
    case "DELETE":
      return <Trash2 className="h-3 w-3 text-red-600" />;
    default:
      return <Activity className="h-3 w-3 text-slate-600" />;
  }
}

function getActivityBadgeClass(action: string) {
  switch (action) {
    case "UPLOAD":
      return "bg-blue-100 text-blue-600";
    case "DOWNLOAD":
      return "bg-purple-100 text-purple-600";
    case "CREATE_FOLDER":
    case "RENAME_FOLDER":
      return "bg-amber-100 text-amber-600";
    case "SHARE":
      return "bg-emerald-100 text-emerald-600";
    case "DELETE":
      return "bg-red-100 text-red-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function Dashboard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [fileToShare, setFileToShare] = useState<{ id: string; name: string } | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
      toast.error(err.message || "Unable to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleCreateFolder = async (folderName: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch("/api/backend/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderName }),
      });

      if (!res.ok) {
        throw new Error("Failed to create folder");
      }

      toast.success(`Folder "${folderName}" created`);
      setIsFolderModalOpen(false);
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Could not create folder");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/backend/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "File upload failed");
      }

      toast.success(`"${file.name}" uploaded successfully`);
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadFile = async (file: DashboardFile) => {
    try {
      toast.info(`Preparing "${file.name}" for download...`);
      const res = await downloadFileWithAnalytics(file.id);
      const link = document.createElement("a");
      link.href = res.downloadUrl;
      link.download = file.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Download started for "${file.name}"`);
      // Refresh to update download metrics live
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    }
  };

  const handlePreview = (file: DashboardFile) => {
    if (!file.url) {
      toast.error("File preview is unavailable for this item");
      return;
    }
    const mime = file.mimeType.toLowerCase();
    const isImg = mime.startsWith("image/");
    setPreviewFile({
      name: file.name,
      url: file.url,
      type: isImg ? "image" : "pdf",
    });
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-slate-200 rounded-md" />
            <div className="h-4 w-72 bg-slate-100 rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-slate-200 rounded-lg" />
            <div className="h-9 w-28 bg-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-7 w-7 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-6 w-14 bg-slate-200 rounded" />
            </div>
          ))}
        </div>

        {/* Balanced Content Skeleton without profile card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-84 bg-white rounded-xl border border-slate-200 p-5" />
          <div className="lg:col-span-5 h-84 bg-white rounded-xl border border-slate-200 p-5" />
          <div className="lg:col-span-12 h-96 bg-white rounded-xl border border-slate-200 p-5" />
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 shadow-xs text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to load dashboard data</h2>
        <p className="text-sm text-slate-600">
          {error || "An unexpected error occurred while communicating with the analytics service."}
        </p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { storage, files, folders, shares, downloads, activitySummary, recentFiles, recentActivity, user } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. Header / Greeting Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {getGreeting()}, {user.name || "User"}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Synced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time analytics and activity for your cloud storage workspace.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FolderPlus className="h-3.5 w-3.5 text-slate-600" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{isUploading ? "Uploading..." : "Upload File"}</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Statistics Cards (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Files */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Files</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {files.total}
            </span>
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>{files.favoritesCount} favorited</span>
            <span className="mx-1.5">•</span>
            <span>{files.trashedCount} trashed</span>
          </div>
        </div>

        {/* Card 2: Folders */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Folders</span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Folder className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {folders.total}
            </span>
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>{folders.rootCount} root</span>
            <span className="mx-1.5">•</span>
            <span>{folders.trashedCount} trashed</span>
          </div>
        </div>

        {/* Card 3: Shared Items (Total active shared items in user account) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Shared Items</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Share2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {shares.total}
            </span>
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>{shares.sentCount} sent</span>
            <span className="mx-1.5">•</span>
            <span>{shares.receivedCount} received</span>
          </div>
        </div>

        {/* Card 4: Downloads */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Downloads</span>
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Download className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {downloads.totalDownloads}
            </span>
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              {downloads.downloadsThisWeek}
            </span>
            <span className="ml-1">in last 7 days</span>
          </div>
        </div>
      </div>

      {/* Row 1: Balanced Side-by-Side Analytics (Storage Allocation & Recent Activity Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Storage Overview & Category Visualization */}
        <section className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Storage Allocation & Categories
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated from active files in your account
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700">
                  {storage.usedFormatted}
                </span>
                <span className="text-xs text-slate-400"> / {storage.quotaFormatted}</span>
                <span className="text-[11px] text-blue-600 font-semibold ml-1.5">
                  ({storage.percentageUsed}%)
                </span>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="mt-4 space-y-2">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                {files.byCategory.map((cat) => {
                  if (cat.percentage <= 0) return null;
                  const colorConfig = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Other;
                  return (
                    <div
                      key={cat.category}
                      style={{ width: `${Math.max(cat.percentage, 1)}%` }}
                      className={`${colorConfig.bar} h-full transition-all duration-300`}
                      title={`${cat.category}: ${cat.formattedBytes} (${cat.percentage}%)`}
                    />
                  );
                })}
                {storage.usedBytes === 0 && (
                  <div className="w-full h-full bg-slate-200" title="Empty storage" />
                )}
              </div>
            </div>

            {/* Category Breakdown Table / Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {files.byCategory.map((cat) => {
                const colorConfig = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Other;
                return (
                  <div
                    key={cat.category}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-2 w-2 rounded-full ${colorConfig.bar}`} />
                        <span className="text-xs font-semibold text-slate-800">
                          {cat.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {cat.count} files
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {cat.formattedBytes}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Activity Summary Bar with Clear "Shares this week" Label */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-medium text-slate-500">Activity this week:</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center space-x-1">
                <Upload className="h-3 w-3 text-blue-500" />
                <strong className="text-slate-800">{activitySummary.uploadsThisWeek}</strong> uploads
              </span>
              <span className="flex items-center space-x-1">
                <Download className="h-3 w-3 text-purple-500" />
                <strong className="text-slate-800">{activitySummary.downloadsThisWeek}</strong> downloads
              </span>
              <span className="flex items-center space-x-1">
                <Share2 className="h-3 w-3 text-emerald-500" />
                <strong className="text-slate-800">{shares.total}</strong> shares
              </span>
              <span className="flex items-center space-x-1">
                <Trash2 className="h-3 w-3 text-red-500" />
                <strong className="text-slate-800">{activitySummary.deletesThisWeek}</strong> deletes
              </span>
            </div>
          </div>
        </section>

        {/* Right Column (5 cols): Recent Activity Timeline naturally expanded */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-slate-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Live Feed</span>
            </div>

            {recentActivity.length > 0 ? (
              <div className="mt-4 space-y-3.5 max-h-[330px] overflow-y-auto pr-1 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {recentActivity.map((act) => (
                  <div key={act.id} className="relative flex items-start space-x-3 pl-0.5">
                    <div
                      className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white ${getActivityBadgeClass(
                        act.action
                      )}`}
                    >
                      {getActivityIcon(act.action)}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-xs font-semibold text-slate-800 leading-snug break-words">
                        {act.description}
                      </p>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-500 uppercase tracking-wider">
                          {act.action.replace("_", " ")}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(act.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <Activity className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">No activity logs recorded yet</p>
                <p className="text-[11px] text-slate-400">
                  Actions such as uploading, downloading, and creating folders will appear here.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Real-time event logging</span>
            <span className="text-slate-500 font-medium">{recentActivity.length} recent events</span>
          </div>
        </section>
      </div>

      {/* Row 2: Recent Files (Full-Width Table) */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Files</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest files added or modified in your workspace
            </p>
          </div>
          <Link
            href="/folders"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>View all files</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentFiles.length > 0 ? (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Uploaded</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2.5 max-w-[280px] sm:max-w-md">
                        <span className="shrink-0">
                          {getFileIcon(file.category, file.mimeType)}
                        </span>
                        <span
                          className="font-medium text-slate-800 truncate hover:text-blue-600 cursor-pointer"
                          title={file.name}
                          onClick={() => handlePreview(file)}
                        >
                          {file.name}
                        </span>
                        {file.isFavorite && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {file.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {file.formattedSize}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePreview(file)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Preview File"
                          aria-label="Preview File"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="p-1 rounded text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Download File"
                          aria-label="Download File"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setFileToShare({ id: file.id, name: file.name })}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Share File"
                          aria-label="Share File"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center space-y-2">
            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No files uploaded yet</p>
            <p className="text-[11px] text-slate-400">
              Upload your documents, images, and archives to see them here.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Upload className="h-3 w-3" />
              <span>Upload now</span>
            </button>
          </div>
        )}
      </section>

      {/* Row 3: Most Downloaded Files (if available) */}
      {downloads.mostDownloadedFiles.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Most Downloaded Files
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Top ranking</span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {downloads.mostDownloadedFiles.map((item) => (
              <div
                key={item.fileId}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.formattedSize}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 shrink-0">
                  {item.downloadCount} {item.downloadCount === 1 ? "download" : "downloads"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />

      {/* Share File Modal */}
      {fileToShare && (
        <ShareFileModal
          isOpen={Boolean(fileToShare)}
          onClose={() => setFileToShare(null)}
          file={{ id: fileToShare.id, name: fileToShare.name }}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-h-full max-w-4xl w-full bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-800 truncate">
                {previewFile.name}
              </span>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-[75vh] w-full flex justify-center overflow-auto">
              {previewFile.type === "image" ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[70vh] rounded-lg object-contain"
                />
              ) : (
                <iframe
                  src={
                    previewFile.url.toLowerCase().endsWith(".pdf")
                      ? previewFile.url
                      : `${previewFile.url}.pdf`
                  }
                  title={previewFile.name}
                  className="w-full h-[70vh] rounded-lg border-none"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}