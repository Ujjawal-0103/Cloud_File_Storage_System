"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  FileText,
  Plus,
  Grid,
  List,
  Search,
  MoreVertical,
  ChevronRight,
  Share2,
  Star,
  Trash2,
  Download,
  FolderPlus,
  HardDrive,
  FileImage,
  FileCode,
  Upload,
} from "lucide-react";
import CreateFolderModal from "./CreateFolderModal";

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

interface FolderExplorerProps {
  currentFolderId?: string;
}

export default function FolderExplorer({ currentFolderId }: FolderExplorerProps) {
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // 1. Fetch Folders
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const token = getAuthToken();
        const url = currentFolderId
          ? `/api/backend/folders?parentId=${currentFolderId}`
          : "/api/backend/folders";

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFolders(Array.isArray(data) ? data : data.folders || []);
        } else {
          console.error("Failed to load folders from backend. Status:", response.status);
        }
      } catch (error) {
        console.error("Network error while fetching folders:", error);
      }
    };

    fetchFolders();
  }, [currentFolderId]);

  // 2. Fetch Files
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = getAuthToken();
        const url = currentFolderId
          ? `/api/backend/files?folderId=${currentFolderId}`
          : "/api/backend/files";

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const backendFiles = Array.isArray(data) ? data : data.files || [];

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
              updatedAt: "Just now",
              url: file.url,
            };
          });

          setFiles(formattedFiles);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, [currentFolderId]);

  // 3. Create Folder
  const handleCreateFolder = async (name: string) => {
    try {
      const token = getAuthToken();

      const bodyData: any = { name: name };
      if (currentFolderId) {
        bodyData.parentId = currentFolderId;
      }

      const response = await fetch("/api/backend/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        const backendFolder = await response.json();
        const newFolder: FolderItem = {
          id: backendFolder.id || Date.now().toString(),
          name: backendFolder.name || name,
          itemCount: 0,
          size: "0 KB",
          updatedAt: "Just now",
        };
        setFolders([newFolder, ...folders]);
      } else {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        alert(`Backend Error: ${errorMessage}`);
      }
    } catch (error) {
      alert("Network Error: Could not reach the backend. Is NestJS running?");
    }
  };

  // 4. Upload File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("file", file);

      if (currentFolderId) {
        formData.append("folderId", currentFolderId);
      }

      const response = await fetch("/api/backend/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert("File uploaded successfully!");
        if (data.file) {
          const mime = (data.file.mimeType || data.file.mimetype || "").toLowerCase();
          let fileType: "image" | "code" | "document" | "pdf" = "document";
          if (mime.includes("image")) fileType = "image";
          else if (mime.includes("pdf")) fileType = "pdf";

          const newFileItem: FileItem = {
            id: data.file.id,
            name: data.file.originalName || data.file.name,
            type: fileType,
            size: `${(data.file.size / 1024).toFixed(1)} KB`,
            updatedAt: "Just now",
            url: data.file.url,
          };
          setFiles([newFileItem, ...files]);
        }
      } else {
        const errorData = await response.json();
        alert(`Upload failed: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      alert("Network Error: Could not upload file.");
    }
  };

  // 5. Delete Folder
  const confirmDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToDelete(id);
  };

  const executeDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/backend/folders/${folderToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFolders(folders.filter((f) => f.id !== folderToDelete));
        setFolderToDelete(null);
      } else {
        alert("Failed to delete folder on the backend.");
        setFolderToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      setFolderToDelete(null);
    }
  };

  // 6. Navigation
  const handleFolderClick = (folder: FolderItem) => {
    router.push(`/files/${folder.id}`);
  };

  const filteredFolders = folders.filter((folder: any) => {
    const matchesSearch = folder.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const folderParentId = folder.parentId || folder.parent_id || null;
    const matchesParent = currentFolderId
      ? folderParentId === currentFolderId
      : !folderParentId;

    return matchesSearch && matchesParent;
  });

  const filteredFiles = files.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] rounded-[24px] p-8 space-y-6 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Folder Explorer</h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
            <input
              type="text"
              placeholder="Search folders & files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2 text-xs text-white placeholder-[#7D879C] focus:outline-none focus:border-[#8B5CF6] transition-all"
            />
          </div>

          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={() => document.getElementById("fileInput")?.click()}
            className="flex items-center space-x-2 rounded-xl bg-white/5 border border-white/15 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Upload File</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] px-4 py-2 text-xs font-medium text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
          </button>

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

      {/* Folders Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7D879C]">
          Folders ({filteredFolders.length})
        </h2>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
                className="group relative rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-[#8B5CF6]/40 hover:bg-white/10 transition-all duration-200 shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:scale-105 transition-transform">
                      <Folder className="h-6 w-6 fill-[#8B5CF6]/20" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-[#C4B5FD] transition-colors">
                        {folder.name}
                      </h3>
                      <p className="text-xs text-[#7D879C] mt-0.5">{folder.itemCount || 0} items</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => confirmDeleteFolder(folder.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#7D879C] hover:text-red-400 transition-opacity z-10 relative"
                    title="Delete Folder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#7D879C]">
                  <span>{folder.size || "0 KB"}</span>
                  <span>{folder.updatedAt || "Just now"}</span>
                </div>
              </div>
            ))}

            {filteredFolders.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
                No folders found. Click "New Folder" to create one.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-md">
            <div className="divide-y divide-white/10">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  className="flex items-center justify-between p-4 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-[#8B5CF6] fill-[#8B5CF6]/20" />
                    <span className="font-medium text-sm text-white">{folder.name}</span>
                  </div>
                  <div className="flex items-center space-x-8 text-xs text-[#7D879C]">
                    <span>{folder.itemCount || 0} items</span>
                    <span>{folder.size || "0 KB"}</span>
                    <span>{folder.updatedAt || "Just now"}</span>
                    <button
                      onClick={(e) => confirmDeleteFolder(folder.id, e)}
                      className="text-[#7D879C] hover:text-red-400 transition-colors z-10 relative"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredFolders.length === 0 && (
                <div className="p-8 text-center text-sm text-[#7D879C]">
                  No folders found. Click "New Folder" to create one.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7D879C]">
          Files ({filteredFiles.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-[#06B6D4]/40 hover:bg-white/10 transition-all duration-200 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#06B6D4]/10 text-[#06B6D4]">
                    {file.type === "image" && <FileImage className="h-5 w-5" />}
                    {file.type === "pdf" && <FileText className="h-5 w-5 text-red-400" />}
                    {file.type === "code" && <FileCode className="h-5 w-5 text-yellow-400" />}
                    {file.type === "document" && <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-[#67E8F9] transition-colors">
                      {file.name}
                    </h3>
                    <p className="text-xs text-[#7D879C] mt-0.5">{file.size}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Preview Button */}
                  {(file.type === "image" || file.type === "pdf") && file.url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile({ name: file.name, url: file.url!, type: file.type });
                      }}
                      className="p-1 text-[#7D879C] hover:text-[#06B6D4]"
                      title="Preview File"
                    >
                      {file.type === "pdf" ? <FileText className="h-4 w-4" /> : <FileImage className="h-4 w-4" />}
                    </button>
                  )}

                  {/* Download Button */}
                  {file.url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                      title="Download File"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                        try {
                          const token = getAuthToken();
                          const res = await fetch(`/api/backend/files/${file.id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          });

                          if (res.ok) {
                            setFiles(files.filter((f) => f.id !== file.id));
                          } else {
                            alert("Failed to delete file.");
                          }
                        } catch (err) {
                          alert("Network error while trying to delete file.");
                        }
                      }
                    }}
                    className="p-1 text-[#7D879C] hover:text-red-400 transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#7D879C]">
                <span>Updated</span>
                <span>{file.updatedAt}</span>
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
              No files uploaded yet.
            </div>
          )}
        </div>
      </div>

      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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

      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-[rgba(22,27,48,0.95)] border border-white/10 p-6 rounded-2xl shadow-2xl w-[320px] text-center transform scale-100 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Folder?</h3>
            <p className="text-sm text-[#B7C1D8] mb-6">
              Are you sure you want to delete this folder? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setFolderToDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteFolder}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}