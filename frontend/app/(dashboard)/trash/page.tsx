"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  FileText,
  Grid,
  List,
  Search,
  Trash2,
  RotateCcw,
  FileImage,
  FileCode,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { FolderGridSkeleton, FileTableSkeleton, FileGridSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

interface FolderItem {
  id: string;
  name: string;
  itemCount: number;
  size: string;
  deletedAt: string;
}

interface FileItem {
  id: string;
  name: string;
  type: "image" | "code" | "document" | "pdf";
  size: string;
  deletedAt: string;
  url?: string;
}

const getAuthToken = () => {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_token=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

export default function TrashPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<{
    id: string;
    name: string;
    type: "folder" | "file";
  } | null>(null);

  // 1. Fetch Trashed Items (Files and Folders)
  const fetchTrash = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      const response = await fetch("/api/backend/trash", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load trash (${response.status})`);
      }

      const data = await response.json();

      // Handle folders
      const backendFolders = data.folders || [];
      const formattedFolders: FolderItem[] = backendFolders.map((f: any) => ({
        id: f.id,
        name: f.name,
        itemCount: f.itemCount || 0,
        size: f.size || "0 KB",
        deletedAt: f.deletedAt ? new Date(f.deletedAt).toLocaleDateString() : "Recently",
      }));
      setFolders(formattedFolders);

      // Handle files
      const backendFiles = Array.isArray(data) ? data : data.files || data.data || [];
      const formattedFiles: FileItem[] = backendFiles.map((file: any) => {
        const mime = (file.mimeType || file.mimetype || "").toLowerCase();
        let fileType: "image" | "code" | "document" | "pdf" = "document";
        if (mime.includes("image")) fileType = "image";
        else if (mime.includes("pdf")) fileType = "pdf";

        return {
          id: file.id,
          name: file.originalName || file.name,
          type: fileType,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          deletedAt: file.deletedAt ? new Date(file.deletedAt).toLocaleDateString() : "Recently",
          url: file.url,
        };
      });

      setFiles(formattedFiles);
    } catch (err: any) {
      console.error("Error fetching trash items:", err);
      setError(err.message || "Failed to load trashed items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  // 2. Restore File
  const handleRestoreFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistic UI update
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success("File restored successfully");

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/backend/files/${id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        await fetch(`/api/backend/trash/${id}/restore`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Error restoring file:", error);
    }
  };

  // 3. Restore Folder
  const handleRestoreFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistic UI update
    setFolders((prev) => prev.filter((f) => f.id !== id));
    toast.success("Folder and contents restored successfully");

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/backend/folders/${id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        await fetch(`/api/backend/trash/folders/${id}/restore`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Error restoring folder:", error);
    }
  };

  // 4. Confirm Permanent Delete
  const confirmPermanentDelete = (
    id: string,
    name: string,
    type: "folder" | "file",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setItemToDeletePermanently({ id, name, type });
  };

  // 5. Execute Permanent Delete
  const executePermanentDelete = async () => {
    if (!itemToDeletePermanently) return;
    const { id, type, name } = itemToDeletePermanently;

    if (type === "folder") {
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } else {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }

    setItemToDeletePermanently(null);
    toast.info(`"${name}" permanently deleted`);

    try {
      const token = getAuthToken();
      if (type === "folder") {
        const res = await fetch(`/api/backend/folders/${id}/permanent`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          await fetch(`/api/backend/trash/folders/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } else {
        const res = await fetch(`/api/backend/files/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          await fetch(`/api/backend/trash/${id}/permanent`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    } catch (error) {
      console.error("Error permanently deleting item:", error);
    }
  };

  const filteredFolders = folders.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-slate-800">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Trash</h1>
          <p className="text-xs text-slate-500 mt-0.5">Items in trash can be restored or permanently removed.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search in trash..."
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
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Informative Banner */}
      <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Items in the trash do not count towards your active file limit. You can restore items at any time to return them to their original location, or permanently delete them to free up storage space.
        </p>
      </div>

      {/* Error state */}
      {error && !loading && (
        <ErrorState message={error} onRetry={fetchTrash} />
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-6">
          <FolderGridSkeleton count={4} />
          {viewMode === "grid" ? <FileGridSkeleton count={8} /> : <FileTableSkeleton count={5} />}
        </div>
      )}

      {/* Empty State when no items exist at all */}
      {!loading && !error && folders.length === 0 && files.length === 0 && (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Files and folders you delete will appear here. You can restore them anytime or permanently delete them."
        />
      )}

      {/* Empty State when search matches nothing */}
      {!loading && !error && (folders.length > 0 || files.length > 0) && filteredFolders.length === 0 && filteredFiles.length === 0 && (
        <EmptyState
          icon={Search}
          title="No matching items"
          description={`No trashed items found matching "${searchQuery}".`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery("")}
        />
      )}

      {/* Trashed Folders Section */}
      {!loading && !error && filteredFolders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trashed Folders ({filteredFolders.length})
          </h2>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate" title={folder.name}>
                          {folder.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{folder.itemCount || 0} items</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Deleted {folder.deletedAt}</span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => handleRestoreFolder(folder.id, e)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                        title="Restore Folder"
                        aria-label={`Restore folder ${folder.name}`}
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={(e) => confirmPermanentDelete(folder.id, folder.name, "folder", e)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors"
                        title="Permanently Delete Folder"
                        aria-label={`Permanently delete folder ${folder.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto shadow-xs">
              <div className="divide-y divide-slate-100 min-w-[500px]">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="h-4.5 w-4.5 text-red-600 shrink-0" />
                      <span className="font-medium text-sm text-slate-900 truncate max-w-xs">{folder.name}</span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-slate-500 shrink-0">
                      <span>{folder.itemCount || 0} items</span>
                      <span>Deleted {folder.deletedAt}</span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => handleRestoreFolder(folder.id, e)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                          title="Restore Folder"
                          aria-label={`Restore folder ${folder.name}`}
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={(e) => confirmPermanentDelete(folder.id, folder.name, "folder", e)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors"
                          title="Permanently Delete Folder"
                          aria-label={`Permanently delete folder ${folder.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
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

      {/* Trashed Files Section */}
      {!loading && !error && filteredFiles.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trashed Files ({filteredFiles.length})
          </h2>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        {file.type === "image" && <FileImage className="h-5 w-5" />}
                        {file.type === "pdf" && <FileText className="h-5 w-5" />}
                        {file.type === "code" && <FileCode className="h-5 w-5" />}
                        {file.type === "document" && <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate" title={file.name}>
                          {file.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{file.size}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Deleted {file.deletedAt}</span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => handleRestoreFile(file.id, e)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                        title="Restore File"
                        aria-label={`Restore file ${file.name}`}
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={(e) => confirmPermanentDelete(file.id, file.name, "file", e)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors"
                        title="Permanently Delete File"
                        aria-label={`Permanently delete file ${file.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto shadow-xs">
              <div className="divide-y divide-slate-100 min-w-[500px]">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-red-500 shrink-0">
                        {file.type === "image" && <FileImage className="h-4.5 w-4.5" />}
                        {file.type === "pdf" && <FileText className="h-4.5 w-4.5" />}
                        {file.type === "code" && <FileCode className="h-4.5 w-4.5" />}
                        {file.type === "document" && <FileText className="h-4.5 w-4.5" />}
                      </div>
                      <span className="font-medium text-sm text-slate-900 truncate max-w-xs">{file.name}</span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-slate-500 shrink-0">
                      <span>{file.size}</span>
                      <span>Deleted {file.deletedAt}</span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => handleRestoreFile(file.id, e)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                          title="Restore File"
                          aria-label={`Restore file ${file.name}`}
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={(e) => confirmPermanentDelete(file.id, file.name, "file", e)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors"
                          title="Permanently Delete File"
                          aria-label={`Permanently delete file ${file.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
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

      {/* Permanent Delete Confirmation Modal */}
      {itemToDeletePermanently && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 transition-all duration-200">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Delete Permanently?</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to permanently erase <span className="font-semibold text-slate-800">"{itemToDeletePermanently.name}"</span>? {itemToDeletePermanently.type === "folder" ? "All nested subfolders and files inside will be wiped completely from cloud storage." : "This will wipe the file permanently from storage."} This action cannot be reversed.
            </p>
            <div className="flex space-x-2.5">
              <button
                onClick={() => setItemToDeletePermanently(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executePermanentDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors text-xs font-semibold shadow-xs"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
