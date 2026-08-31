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
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

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

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<{
    id: string;
    name: string;
    type: "folder" | "file";
  } | null>(null);

  // 1. Fetch Trashed Items (Files and Folders)
  const fetchTrash = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch("/api/backend/trash", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
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
      }
    } catch (error) {
      console.error("Error fetching trash items:", error);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  // 2. Restore File
  const handleRestoreFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Immediate optimistic UI update
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

    // Immediate optimistic UI update
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
    const { id, type } = itemToDeletePermanently;

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
    <div className="w-full bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] rounded-[24px] p-8 space-y-6 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trash</h1>
          <p className="text-xs text-[#7D879C] mt-1">Items in trash can be restored or permanently removed.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
            <input
              type="text"
              placeholder="Search trash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2 text-xs text-white placeholder-[#7D879C] focus:outline-none focus:border-[#8B5CF6] transition-all"
            />
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-[#8B5CF6]/30 text-[#C4B5FD]" : "text-[#7D879C] hover:text-white"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-[#8B5CF6]/30 text-[#C4B5FD]" : "text-[#7D879C] hover:text-white"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trashed Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7D879C]">
            Trashed Folders ({filteredFolders.length})
          </h2>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-red-500/30 hover:bg-white/10 transition-all duration-200 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                        <Folder className="h-6 w-6 fill-red-500/20" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white text-sm truncate group-hover:text-red-300 transition-colors" title={folder.name}>
                          {folder.name}
                        </h3>
                        <p className="text-xs text-[#7D879C] mt-0.5 truncate">{folder.itemCount || 0} items</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-[#7D879C]">Deleted: {folder.deletedAt}</span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleRestoreFolder(folder.id, e)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
                        title="Restore Folder"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={(e) => confirmPermanentDelete(folder.id, folder.name, "folder", e)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                        title="Permanently Delete Folder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredFolders.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
                  No matching trashed folders found.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-md">
              <div className="divide-y divide-white/10">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="h-5 w-5 text-red-400 fill-red-500/20" />
                      <span className="font-medium text-sm text-white">{folder.name}</span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-[#7D879C]">
                      <span>{folder.itemCount || 0} items</span>
                      <span>Deleted {folder.deletedAt}</span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleRestoreFolder(folder.id, e)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
                          title="Restore Folder"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={(e) => confirmPermanentDelete(folder.id, folder.name, "folder", e)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                          title="Permanently Delete Folder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7D879C]">
          Trashed Files ({filteredFiles.length})
        </h2>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group relative rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-red-500/30 hover:bg-white/10 transition-all duration-200 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                      {file.type === "image" && <FileImage className="h-5 w-5" />}
                      {file.type === "pdf" && <FileText className="h-5 w-5 text-red-400" />}
                      {file.type === "code" && <FileCode className="h-5 w-5 text-yellow-400" />}
                      {file.type === "document" && <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm truncate group-hover:text-red-300 transition-colors" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="text-xs text-[#7D879C] mt-0.5 truncate">{file.size}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-[#7D879C]">Deleted: {file.deletedAt}</span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleRestoreFile(file.id, e)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
                      title="Restore File"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore</span>
                    </button>

                    <button
                      onClick={(e) => confirmPermanentDelete(file.id, file.name, "file", e)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                      title="Permanently Delete File"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFiles.length === 0 && folders.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
                <Trash2 className="h-8 w-8 text-[#7D879C]/50 mx-auto mb-3" />
                <p className="font-medium text-white">{searchQuery ? `No trashed items matching "${searchQuery}"` : "Trash is empty"}</p>
                <p className="text-xs text-[#7D879C] mt-1">{searchQuery ? "Try searching for a different keyword." : "Deleted items will appear here where you can restore or permanently delete them."}</p>
              </div>
            )}

            {filteredFiles.length === 0 && folders.length > 0 && (
              <div className="col-span-full py-8 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
                {searchQuery ? `No trashed files matching "${searchQuery}".` : "No matching trashed files found."}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-md">
            <div className="divide-y divide-white/10">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-red-400">
                      {file.type === "image" && <FileImage className="h-5 w-5" />}
                      {file.type === "pdf" && <FileText className="h-5 w-5" />}
                      {file.type === "code" && <FileCode className="h-5 w-5" />}
                      {file.type === "document" && <FileText className="h-5 w-5" />}
                    </div>
                    <span className="font-medium text-sm text-white">{file.name}</span>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-[#7D879C]">
                    <span>{file.size}</span>
                    <span>Deleted {file.deletedAt}</span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleRestoreFile(file.id, e)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
                        title="Restore File"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={(e) => confirmPermanentDelete(file.id, file.name, "file", e)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                        title="Permanently Delete File"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredFiles.length === 0 && folders.length === 0 && (
                <div className="p-8 text-center text-sm text-[#7D879C]">
                  Trash is empty.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Permanent Delete Confirmation Modal */}
      {itemToDeletePermanently && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-[rgba(22,27,48,0.95)] border border-white/10 p-6 rounded-2xl shadow-2xl w-[360px] text-center transform scale-100 transition-transform">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Delete Permanently?</h3>
            <p className="text-sm text-[#B7C1D8] mb-6">
              Are you sure you want to permanently delete <span className="font-semibold text-white">"{itemToDeletePermanently.name}"</span>? {itemToDeletePermanently.type === "folder" ? "This folder, all nested subfolders, and all files inside will be permanently deleted and wiped from cloud storage." : "This will wipe the file completely from cloud storage."} This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setItemToDeletePermanently(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executePermanentDelete}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
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
