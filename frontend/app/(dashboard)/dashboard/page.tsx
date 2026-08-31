"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Folder,
  Share2,
  HardDrive,
  Star,
  Trash2,
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  Upload,
  FolderPlus,
  ArrowRight,
  Sparkles,
  Download,
  Eye,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import CreateFolderModal from "@/components/explorer/CreateFolderModal";
import { useToast } from "@/components/ui/Toast";

interface RecentFile {
  id: string;
  name: string;
  type: "image" | "code" | "document" | "pdf";
  size: string;
  sizeBytes: number;
  updatedAt: string;
  url?: string;
  isFavorite?: boolean;
}

interface DashboardFolder {
  id: string;
  name: string;
  itemCount: number;
  size: string;
  updatedAt: string;
  isFavorite?: boolean;
}

const getAuthToken = () => {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_token=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState<string>("User");
  const [isUploading, setIsUploading] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);

  // Stats State
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [totalFoldersCount, setTotalFoldersCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Lists
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [folders, setFolders] = useState<DashboardFolder[]>([]);

  // Category Breakdown
  const [categories, setCategories] = useState({
    images: { count: 0, bytes: 0 },
    documents: { count: 0, bytes: 0 },
    code: { count: 0, bytes: 0 },
    others: { count: 0, bytes: 0 },
  });

  const totalAllocatedBytes = 15 * 1024 * 1024 * 1024; // 15 GB

  useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  const loadDashboardData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      // 1. Storage & Files stats
      const storageRes = await fetch("/api/backend/files/storage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (storageRes.ok) {
        const storageData = await storageRes.json();
        setStorageUsedBytes(storageData.usedBytes || 0);
        setTotalFilesCount(storageData.fileCount || 0);
      }

      // 2. Folders
      const foldersRes = await fetch("/api/backend/folders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        const folderList: any[] = Array.isArray(foldersData) ? foldersData : foldersData.folders || [];
        setTotalFoldersCount(folderList.length);
        const favFolders = folderList.filter((f) => f.isFavorite).length;

        const formattedFolders: DashboardFolder[] = folderList.slice(0, 4).map((f) => ({
          id: f.id,
          name: f.name,
          itemCount: f.itemCount || 0,
          size: f.size || "0 KB",
          updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : "Just now",
          isFavorite: Boolean(f.isFavorite),
        }));
        setFolders(formattedFolders);
        setFavoritesCount((prev) => favFolders);
      }

      // 3. All Files for recent list and category breakdown
      const filesRes = await fetch("/api/backend/files?folderId=all&limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        const filesList: any[] = Array.isArray(filesData)
          ? filesData
          : filesData.files || filesData.data || [];

        // Count favorites
        const favFiles = filesList.filter((f) => f.isFavorite).length;
        setFavoritesCount((prev) => prev + favFiles);

        // Format recent files
        const formatted: RecentFile[] = filesList.slice(0, 6).map((file) => {
          const mime = (file.mimeType || file.mimetype || "").toLowerCase();
          let fileType: "image" | "code" | "document" | "pdf" = "document";
          if (mime.includes("image")) fileType = "image";
          else if (mime.includes("pdf")) fileType = "pdf";
          else if (
            mime.includes("javascript") ||
            mime.includes("typescript") ||
            mime.includes("json") ||
            mime.includes("html")
          ) {
            fileType = "code";
          }

          const sizeBytes = file.size || 0;
          let sizeStr = `${(sizeBytes / 1024).toFixed(1)} KB`;
          if (sizeBytes >= 1024 * 1024) {
            sizeStr = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
          }

          return {
            id: file.id,
            name: file.originalName || file.name,
            type: fileType,
            size: sizeStr,
            sizeBytes,
            updatedAt: file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : "Today",
            url: file.url,
            isFavorite: Boolean(file.isFavorite),
          };
        });
        setRecentFiles(formatted);

        // Calculate Category Breakdown
        const cats = {
          images: { count: 0, bytes: 0 },
          documents: { count: 0, bytes: 0 },
          code: { count: 0, bytes: 0 },
          others: { count: 0, bytes: 0 },
        };

        for (const file of filesList) {
          const mime = (file.mimeType || file.mimetype || "").toLowerCase();
          const sz = file.size || 0;

          if (mime.includes("image")) {
            cats.images.count += 1;
            cats.images.bytes += sz;
          } else if (mime.includes("pdf") || mime.includes("doc") || mime.includes("text") || mime.includes("word")) {
            cats.documents.count += 1;
            cats.documents.bytes += sz;
          } else if (
            mime.includes("javascript") ||
            mime.includes("typescript") ||
            mime.includes("json") ||
            mime.includes("html") ||
            mime.includes("css")
          ) {
            cats.code.count += 1;
            cats.code.bytes += sz;
          } else {
            cats.others.count += 1;
            cats.others.bytes += sz;
          }
        }
        setCategories(cats);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Quick File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/backend/files/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        toast.success(`"${file.name}" uploaded successfully!`);
        await loadDashboardData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Upload failed. Please try again.");
      }
    } catch (err) {
      toast.error("Error uploading file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Quick Create Folder
  const handleCreateFolder = async (folderName: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/backend/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderName }),
      });

      if (res.ok) {
        toast.success(`Folder "${folderName}" created successfully!`);
        await loadDashboardData();
      } else {
        toast.error("Failed to create folder.");
      }
    } catch (err) {
      toast.error("Error creating folder.");
    }
  };

  // Formatting helpers
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const usedPercentage = Math.min(
    100,
    Math.max(0.5, (storageUsedBytes / totalAllocatedBytes) * 100)
  );

  return (
    <div className="space-y-8 text-slate-200">
      {/* ================= HERO & QUICK ACTIONS ================= */}
      <section className="relative overflow-hidden rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-8 md:p-10">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 via-[#6366F1]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-[#06B6D4]/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#C4B5FD]">
            <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <span>Cloud Storage Hub</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome back,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#67E8F9] to-[#06B6D4]">
              {userName}
            </span>
          </h1>
          <p className="text-sm text-[#B7C1D8] max-w-2xl">
            Access your storage overview, monitor active folders, and keep your critical cloud assets organized in real time.
          </p>
        </div>
      </section>

      {/* ================= BENTO METRICS CARDS ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Storage Card */}
        <div className="relative overflow-hidden rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 p-6 shadow-md hover:border-[#8B5CF6]/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D879C]">Storage Used</span>
            <div className="h-10 w-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {formatBytes(storageUsedBytes)}
            </h2>
            <p className="text-xs text-[#7D879C] mt-1">of 15.0 GB available</p>
          </div>
          <div className="mt-5 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] transition-all duration-500"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#7D879C]">
              <span>{usedPercentage.toFixed(1)}% consumed</span>
              <span>{(15 - storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB free</span>
            </div>
          </div>
        </div>

        {/* Total Files */}
        <Link
          href="/files"
          className="relative overflow-hidden rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 p-6 shadow-md hover:border-[#06B6D4]/40 hover:bg-white/10 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D879C]">Total Files</span>
            <div className="h-10 w-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4] group-hover:scale-110 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{totalFilesCount}</h2>
            <p className="text-xs text-[#7D879C] mt-1">Active files stored</p>
          </div>
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#06B6D4]">
            <span className="font-medium">Browse Files</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Total Folders */}
        <Link
          href="/files"
          className="relative overflow-hidden rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 p-6 shadow-md hover:border-[#8B5CF6]/40 hover:bg-white/10 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D879C]">Total Folders</span>
            <div className="h-10 w-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
              <Folder className="h-5 w-5 fill-[#8B5CF6]/20" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{totalFoldersCount}</h2>
            <p className="text-xs text-[#7D879C] mt-1">Organized directories</p>
          </div>
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8B5CF6]">
            <span className="font-medium">View Hierarchy</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Favorites */}
        <Link
          href="/favorites"
          className="relative overflow-hidden rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 p-6 shadow-md hover:border-yellow-500/40 hover:bg-white/10 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D879C]">Favorites</span>
            <div className="h-10 w-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{favoritesCount}</h2>
            <p className="text-xs text-[#7D879C] mt-1">Starred files & folders</p>
          </div>
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-yellow-400">
            <span className="font-medium">Open Favorites</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </section>

      {/* ================= STORAGE CATEGORY ANALYTICS ================= */}
      <section className="rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#06B6D4]" />
              <span>Storage Breakdown by File Type</span>
            </h2>
            <p className="text-xs text-[#7D879C] mt-0.5">Distribution of space used across your cloud assets.</p>
          </div>
          <span className="text-xs text-[#B7C1D8] bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl self-start">
            Total {formatBytes(storageUsedBytes)}
          </span>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Images */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 hover:border-[#06B6D4]/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4]">
                  <FileImage className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-white">Images</span>
              </div>
              <span className="text-xs text-[#7D879C]">{categories.images.count} files</span>
            </div>
            <p className="text-lg font-bold text-white tracking-tight">{formatBytes(categories.images.bytes)}</p>
          </div>

          {/* Documents */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 hover:border-[#8B5CF6]/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-white">Documents</span>
              </div>
              <span className="text-xs text-[#7D879C]">{categories.documents.count} files</span>
            </div>
            <p className="text-lg font-bold text-white tracking-tight">{formatBytes(categories.documents.bytes)}</p>
          </div>

          {/* Code */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 hover:border-yellow-400/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                  <FileCode className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-white">Code & Text</span>
              </div>
              <span className="text-xs text-[#7D879C]">{categories.code.count} files</span>
            </div>
            <p className="text-lg font-bold text-white tracking-tight">{formatBytes(categories.code.bytes)}</p>
          </div>

          {/* Others */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                  <FileArchive className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-white">Other Assets</span>
              </div>
              <span className="text-xs text-[#7D879C]">{categories.others.count} files</span>
            </div>
            <p className="text-lg font-bold text-white tracking-tight">{formatBytes(categories.others.bytes)}</p>
          </div>
        </div>
      </section>

      {/* ================= QUICK ACCESS FOLDERS ================= */}
      {folders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Quick Access Folders</h2>
            <Link href="/files" className="text-xs text-[#8B5CF6] hover:text-[#C4B5FD] flex items-center gap-1 font-medium">
              <span>View all folders</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/files/${folder.id}`}
                className="group relative rounded-2xl bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 p-4 hover:border-[#8B5CF6]/40 hover:bg-white/10 transition-all shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:scale-105 transition-transform">
                      <Folder className="h-6 w-6 fill-[#8B5CF6]/20" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#C4B5FD] transition-colors" title={folder.name}>
                        {folder.name}
                      </h3>
                      <p className="text-xs text-[#7D879C] mt-0.5 truncate">{folder.itemCount} items</p>
                    </div>
                  </div>
                  {folder.isFavorite && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#7D879C]">
                  <span>{folder.size}</span>
                  <span>{folder.updatedAt}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= RECENT FILES ================= */}
      <section className="rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#8B5CF6]" />
              <span>Recent Uploads</span>
            </h2>
            <p className="text-xs text-[#7D879C] mt-0.5">Your most recently updated and uploaded files.</p>
          </div>
          <Link
            href="/files"
            className="text-xs font-semibold text-[#8B5CF6] hover:text-[#C4B5FD] flex items-center gap-1 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span>All Files</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="group relative rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-[#06B6D4]/40 hover:bg-white/10 transition-all shadow-md flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#06B6D4]/10 text-[#06B6D4]">
                      {file.type === "image" && <FileImage className="h-5 w-5" />}
                      {file.type === "pdf" && <FileText className="h-5 w-5 text-red-400" />}
                      {file.type === "code" && <FileCode className="h-5 w-5 text-yellow-400" />}
                      {file.type === "document" && <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#67E8F9] transition-colors" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="text-xs text-[#7D879C] mt-0.5 truncate">{file.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Preview */}
                    {(file.type === "image" || file.type === "pdf") && file.url && (
                      <button
                        onClick={() => setPreviewFile({ name: file.name, url: file.url!, type: file.type })}
                        className="p-1 text-[#7D879C] hover:text-[#06B6D4] transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}

                    {/* Download */}
                    {file.url && (
                      <button
                        onClick={() => {
                          let downloadUrl = file.url!;
                          if (downloadUrl.includes("/upload/")) {
                            downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
                          }
                          const link = document.createElement("a");
                          link.href = downloadUrl;
                          link.target = "_blank";
                          link.download = file.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="p-1 text-[#7D879C] hover:text-white transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#7D879C]">
                  <span>Uploaded {file.updatedAt}</span>
                  {file.isFavorite && (
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
            <Upload className="h-8 w-8 text-[#7D879C]/40 mx-auto mb-2" />
            <p className="font-semibold text-white">No files uploaded yet</p>
            <p className="text-xs text-[#7D879C] mt-1">Upload your first file using the button above to view recent activity.</p>
          </div>
        )}
      </section>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-h-full max-w-full w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
            {previewFile.type === "image" ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
              />
            ) : (
              <iframe
                src={previewFile.url.toLowerCase().endsWith(".pdf") ? previewFile.url : `${previewFile.url}.pdf`}
                title={previewFile.name}
                className="w-[90vw] h-[80vh] rounded-xl bg-white shadow-2xl border-none"
              />
            )}

            <button
              onClick={() => setPreviewFile(null)}
              className="absolute right-0 -top-10 md:-right-4 md:-top-4 rounded-full bg-black/80 px-3 py-1 text-xl text-white hover:text-red-400 transition-colors"
              aria-label="Close preview"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}