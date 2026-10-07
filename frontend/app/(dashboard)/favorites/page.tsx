"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  FileText,
  Grid,
  List,
  Search,
  Star,
  Trash2,
  Download,
  Share2,
  FileImage,
  FileCode,
  Eye,
  X,
} from "lucide-react";
import ShareFileModal from "@/components/sharing/ShareFileModal";
import { useToast } from "@/components/ui/Toast";
import { FolderGridSkeleton, FileTableSkeleton, FileGridSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

interface FolderItem {
  id: string;
  name: string;
  itemCount: number;
  size: string;
  updatedAt: string;
  isFavorite?: boolean;
}

interface FileItem {
  id: string;
  name: string;
  type: "image" | "code" | "document" | "pdf";
  size: string;
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

export default function FavoritesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [fileToShare, setFileToShare] = useState<FileItem | null>(null);

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Favorite Folders
  const fetchFavoriteFolders = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch("/api/backend/folders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const backendFolders = Array.isArray(data) ? data : data.folders || data.data || [];
        const favoriteFolders: FolderItem[] = backendFolders
          .filter((f: any) => f.isFavorite === true)
          .map((f: any) => ({
            id: f.id,
            name: f.name,
            itemCount: f.itemCount || 0,
            size: f.size || "0 KB",
            updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : "Just now",
            isFavorite: true,
          }));
        setFolders(favoriteFolders);
      } else {
        throw new Error("Could not load favorite folders");
      }
    } catch (error: any) {
      console.error("Error fetching favorite folders:", error);
      throw error;
    }
  }, []);

  // 2. Fetch Favorite Files
  const fetchFavoriteFiles = useCallback(async () => {
    try {
      const token = getAuthToken();

      // Attempt to fetch from favorites endpoint
      const favResponse = await fetch("/api/backend/favorites", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (favResponse.ok) {
        const favData = await favResponse.json();
        const favList = Array.isArray(favData) ? favData : favData.favorites || favData.data || [];

        if (favList.length > 0) {
          const formattedFiles: FileItem[] = favList.map((item: any) => {
            const file = item.file || item;
            const mime = (file.mimeType || file.mimetype || "").toLowerCase();
            let fileType: "image" | "code" | "document" | "pdf" = "document";
            if (mime.includes("image")) fileType = "image";
            else if (mime.includes("pdf")) fileType = "pdf";

            return {
              id: file.id,
              name: file.originalName || file.name,
              type: fileType,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              updatedAt: file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : "Just now",
              url: file.url,
              isFavorite: true,
            };
          });
          setFiles(formattedFiles);
          return;
        }
      }

      // Fallback: fetch all files and filter where isFavorite === true
      const filesResponse = await fetch("/api/backend/files?folderId=all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (filesResponse.ok) {
        const data = await filesResponse.json();
        const backendFiles = Array.isArray(data) ? data : data.data || data.files || [];

        const formattedFiles: FileItem[] = backendFiles
          .filter((file: any) => file.isFavorite === true || (file.favorites && file.favorites.length > 0))
          .map((file: any) => {
            const mime = (file.mimeType || file.mimetype || "").toLowerCase();
            let fileType: "image" | "code" | "document" | "pdf" = "document";
            if (mime.includes("image")) fileType = "image";
            else if (mime.includes("pdf")) fileType = "pdf";

            return {
              id: file.id,
              name: file.originalName || file.name,
              type: fileType,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              updatedAt: file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : "Just now",
              url: file.url,
              isFavorite: true,
            };
          });

        setFiles(formattedFiles);
      }
    } catch (error: any) {
      console.error("Error fetching favorite files:", error);
      throw error;
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchFavoriteFolders(), fetchFavoriteFiles()]);
    } catch (err: any) {
      setError(err?.message || "Failed to load starred items");
    } finally {
      setLoading(false);
    }
  }, [fetchFavoriteFolders, fetchFavoriteFiles]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // 3. Toggle Favorite for File
  const toggleFavoriteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetFile = files.find((f) => f.id === id);
    const newFavoriteState = !targetFile?.isFavorite;

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isFavorite: newFavoriteState } : f))
    );

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/backend/files/${id}/favorite`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorite: newFavoriteState }),
      });

      if (!res.ok && (res.status === 404 || res.status === 405)) {
        if (newFavoriteState) {
          await fetch(`/api/backend/favorites/${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          await fetch(`/api/backend/favorites/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    } catch (err) {
      console.error("Error toggling file favorite:", err);
    }
  };

  // 4. Toggle Favorite for Folder
  const toggleFavoriteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetFolder = folders.find((f) => f.id === id);
    const newFavoriteState = !targetFolder?.isFavorite;

    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isFavorite: newFavoriteState } : f))
    );

    try {
      const token = getAuthToken();
      await fetch(`/api/backend/folders/${id}/favorite`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorite: newFavoriteState }),
      });
    } catch (err) {
      console.error("Error toggling folder favorite:", err);
    }
  };

  // 5. Delete Folder
  const confirmDeleteFolder = (folder: { id: string; name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToDelete({ id: folder.id, name: folder.name });
  };

  const executeDeleteFolder = async () => {
    if (!folderToDelete) return;
    const targetId = folderToDelete.id;
    const targetName = folderToDelete.name;
    setFolders((prev) => prev.filter((f) => f.id !== targetId));
    setFolderToDelete(null);
    toast.info(`"${targetName}" moved to Trash`);

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/backend/folders/${targetId}/trash`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await fetch(`/api/backend/folders/${targetId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  // 6. Navigation
  const handleFolderClick = (folder: FolderItem) => {
    router.push(`/files/${folder.id}`);
  };

  const filteredFolders = folders.filter((folder) =>
    folder.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-slate-800">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Favorites</h1>
          <p className="text-xs text-slate-500 mt-0.5">Quick access to all your starred folders and files.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search favorites..."
              aria-label="Search favorites"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>

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

      {/* Error State */}
      {error && (
        <ErrorState
          title="Could not load starred items"
          message={error}
          onRetry={loadFavorites}
        />
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse" />
            <FolderGridSkeleton count={3} />
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse" />
            {viewMode === "list" ? (
              <FileTableSkeleton count={5} />
            ) : (
              <FileGridSkeleton count={6} />
            )}
          </div>
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <EmptyState
          icon={Star}
          title={searchQuery ? `No starred items matching "${searchQuery}"` : "No starred items yet"}
          description={
            searchQuery
              ? "Check for typos or try searching with different terms."
              : "Star files or folders across your workspace to quickly access them here."
          }
          actionText={searchQuery ? undefined : "Browse My Files"}
          actionHref={searchQuery ? undefined : "/files"}
        />
      ) : (
        <>
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Starred Folders ({filteredFolders.length})
          </h2>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  className="group relative rounded-xl bg-white border border-slate-200 p-4 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors" title={folder.name}>
                          {folder.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{folder.itemCount || 0} items</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-0.5 shrink-0 z-10 relative">
                      <button
                        onClick={(e) => toggleFavoriteFolder(folder.id, e)}
                        className="p-1 rounded text-amber-500 hover:bg-slate-100 transition-colors"
                        title="Remove from Favorites"
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      </button>
                      <button
                        onClick={(e) => confirmDeleteFolder(folder, e)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                        title="Delete Folder"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{folder.size || "0 KB"}</span>
                    <span>{folder.updatedAt || "Just now"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => handleFolderClick(folder)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="h-4.5 w-4.5 text-blue-600" />
                      <span className="font-medium text-sm text-slate-900">{folder.name}</span>
                    </div>
                    <div className="flex items-center space-x-6 text-xs text-slate-500">
                      <span>{folder.itemCount || 0} items</span>
                      <span>{folder.size || "0 KB"}</span>
                      <span>{folder.updatedAt || "Just now"}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => toggleFavoriteFolder(folder.id, e)}
                          className="p-1 rounded text-amber-500 hover:bg-slate-100"
                          title="Remove from Favorites"
                        >
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        </button>
                        <button
                          onClick={(e) => confirmDeleteFolder(folder, e)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100"
                          title="Delete Folder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Files Section */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Starred Files ({filteredFiles.length})
        </h2>

        {viewMode === "list" ? (
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 w-28">Type</th>
                    <th className="py-3 px-4 w-28">Size</th>
                    <th className="py-3 px-4 w-32">Updated</th>
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
                            onClick={(e) => toggleFavoriteFile(file.id, e)}
                            className="p-1.5 rounded text-amber-500 hover:bg-slate-100 transition-colors"
                            title="Remove from Favorites"
                          >
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          </button>

                          <button
                            onClick={() => setFileToShare(file)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Share"
                          >
                            <Share2 className="h-3.5 w-3.5" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group relative rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all"
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

                  <div className="flex items-center space-x-0.5 shrink-0">
                    {(file.type === "image" || file.type === "pdf") && file.url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFile({ name: file.name, url: file.url!, type: file.type });
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Preview File"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => toggleFavoriteFile(file.id, e)}
                      className="p-1 rounded text-amber-500 hover:bg-slate-100 transition-colors"
                      title="Remove from Favorites"
                    >
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    </button>

                    <button
                      onClick={() => setFileToShare(file)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      title="Share File"
                    >
                      <Share2 className="h-4 w-4" />
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
      </div>
      </>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-h-full max-w-4xl w-full bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-800 truncate">{previewFile.name}</span>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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

      {/* Delete Folder Modal */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 transition-all duration-200">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                <Trash2 className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Move Folder to Trash?</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              <span className="font-semibold text-slate-800">"{folderToDelete.name}"</span> and all items inside it will be moved to Trash. You can restore them anytime from the Trash page.
            </p>
            <div className="flex space-x-2.5">
              <button
                onClick={() => setFolderToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteFolder}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors text-xs font-semibold shadow-xs"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share File Modal */}
      <ShareFileModal
        isOpen={!!fileToShare}
        onClose={() => setFileToShare(null)}
        file={fileToShare}
      />
    </div>
  );
}
