"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Search,
  Grid,
  List,
  FileText,
  FileImage,
  FileCode,
  Eye,
  Star,
  Download,
  Share2,
  Trash2,
  X,
  Upload,
} from "lucide-react";
import ShareFileModal from "@/components/sharing/ShareFileModal";
import { useToast } from "@/components/ui/Toast";
import { FileTableSkeleton, FileGridSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

interface FileItem {
  id: string;
  name: string;
  type: "image" | "code" | "document" | "pdf";
  size: string;
  sizeBytes: number;
  updatedAt: string;
  isFavorite?: boolean;
  url?: string;
}

const getAuthToken = () => {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_token=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

export default function RecentPage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [fileToShare, setFileToShare] = useState<FileItem | null>(null);

  const fetchRecentFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch("/api/backend/files?folderId=all&limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const filesList: any[] = Array.isArray(data) ? data : data.files || data.data || [];

        const formatted: FileItem[] = filesList.map((file) => {
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

        setFiles(formatted);
      } else {
        throw new Error("Could not load recent files");
      }
    } catch (err: any) {
      console.error("Error fetching recent files:", err);
      setError(err?.message || "Failed to load recent files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const toggleFavoriteFile = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = getAuthToken();
      const current = files.find((f) => f.id === fileId);
      const newFavState = !current?.isFavorite;

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, isFavorite: newFavState } : f))
      );

      const res = await fetch(`/api/backend/favorites/files/${fileId}`, {
        method: newFavState ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, isFavorite: !newFavState } : f))
        );
      } else {
        toast.success(newFavState ? "Added to favorites" : "Removed from favorites");
      }
    } catch {
      toast.error("Failed to update favorite status");
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Recent Files</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Files you have recently uploaded, accessed, or modified.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search recent files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="List View"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <ErrorState
          title="Could not load recent files"
          message={error}
          onRetry={fetchRecentFiles}
        />
      )}

      {/* Files Display */}
      {loading ? (
        <div className="py-2">
          {viewMode === "list" ? (
            <FileTableSkeleton count={6} />
          ) : (
            <FileGridSkeleton count={6} />
          )}
        </div>
      ) : filteredFiles.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={searchQuery ? `No files matching "${searchQuery}"` : "No recent files yet"}
          description={
            searchQuery
              ? "Check for typos or try searching a different name."
              : "Files you upload, open, or modify will appear here automatically."
          }
          actionText={searchQuery ? undefined : "Browse My Files"}
          actionHref={searchQuery ? undefined : "/files"}
        />
      ) : viewMode === "list" ? (
        /* Table / List View */
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4 w-28">Type</th>
                  <th className="py-3 px-4 w-28">Size</th>
                  <th className="py-3 px-4 w-32">Modified</th>
                  <th className="py-3 px-4 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-600">
                          {file.type === "image" && <FileImage className="h-4 w-4 text-pink-500" />}
                          {file.type === "pdf" && <FileText className="h-4 w-4 text-red-500" />}
                          {file.type === "code" && <FileCode className="h-4 w-4 text-amber-500" />}
                          {file.type === "document" && <FileText className="h-4 w-4 text-blue-500" />}
                        </div>
                        <span className="font-medium text-slate-900 truncate max-w-xs">{file.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-medium text-slate-500">{file.type}</td>
                    <td className="py-3 px-4 text-slate-500">{file.size}</td>
                    <td className="py-3 px-4 text-slate-500">{file.updatedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        {(file.type === "image" || file.type === "pdf") && file.url && (
                          <button
                            onClick={() => setPreviewFile({ name: file.name, url: file.url!, type: file.type })}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setFileToShare(file)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Share"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={(e) => toggleFavoriteFile(file.id, e)}
                          className={`p-1.5 rounded transition-colors ${
                            file.isFavorite ? "text-amber-500" : "text-slate-400 hover:text-amber-500"
                          }`}
                          title={file.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        >
                          <Star className={`h-3.5 w-3.5 ${file.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>

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
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-blue-600">
                    {file.type === "image" && <FileImage className="h-5 w-5 text-pink-500" />}
                    {file.type === "pdf" && <FileText className="h-5 w-5 text-red-500" />}
                    {file.type === "code" && <FileCode className="h-5 w-5 text-amber-500" />}
                    {file.type === "document" && <FileText className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{file.size}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => toggleFavoriteFile(file.id, e)}
                    className="p-1 text-slate-400 hover:text-amber-500 rounded transition-colors"
                  >
                    <Star className={`h-4 w-4 ${file.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Updated {file.updatedAt}</span>
                <span className="uppercase text-[10px] font-medium text-slate-400">{file.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
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
              <span className="font-semibold text-sm text-slate-800 truncate">{previewFile.name}</span>
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
                  src={previewFile.url.toLowerCase().endsWith(".pdf") ? previewFile.url : `${previewFile.url}.pdf`}
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
