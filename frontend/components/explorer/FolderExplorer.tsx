"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  FileText,
  Grid,
  List,
  Search,
  Share2,
  Star,
  Trash2,
  Download,
  FolderPlus,
  FileImage,
  FileCode,
  Upload,
  Edit2,
  FolderInput,
  Copy,
  Loader2,
  CloudUpload,
  X,
  Eye,
} from "lucide-react";
import CreateFolderModal from "./CreateFolderModal";
import RenameFileModal from "./RenameFileModal";
import MoveFileModal from "./MoveFileModal";
import CopyFileModal from "./CopyFileModal";
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
  parentId?: string | null;
}

interface FileItem {
  id: string;
  name: string;
  type: "image" | "code" | "document" | "pdf";
  size: string;
  rawSize?: number;
  updatedAt: string;
  isFavorite?: boolean;
  url?: string;
  folderId?: string | null;
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
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") || params.get("search");
      if (q) setSearchQuery(q);
    }
  }, []);

  // File action modals state
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [fileToMove, setFileToMove] = useState<FileItem | null>(null);
  const [fileToCopy, setFileToCopy] = useState<FileItem | null>(null);

  // Sharing state (supports both files and folders)
  const [shareTarget, setShareTarget] = useState<{
    file?: FileItem | null;
    folder?: FolderItem | null;
  } | null>(null);

  // Drag & drop and real upload progress state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    percent: number;
  } | null>(null);

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchResults, setSearchResults] = useState<{ files: FileItem[]; folders: FolderItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Folders
  const fetchFolders = useCallback(async () => {
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
        const backendFolders = Array.isArray(data) ? data : data.folders || data.data || [];
        const formattedFolders: FolderItem[] = backendFolders.map((f: any) => ({
          id: f.id,
          name: f.name,
          itemCount: f.itemCount || 0,
          size: f.size || "0 KB",
          updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : "Just now",
          isFavorite: Boolean(f.isFavorite),
          parentId: f.parentId || f.parent_id || null,
        }));
        setFolders(formattedFolders);
      } else {
        throw new Error("Could not load folders");
      }
    } catch (error: any) {
      console.error("Network error while fetching folders:", error);
      throw error;
    }
  }, [currentFolderId]);

  // 2. Fetch Files
  const fetchFiles = useCallback(async () => {
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
        const backendFiles = Array.isArray(data) ? data : data.data || data.files || [];

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
            rawSize: file.size,
            updatedAt: file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : "Just now",
            url: file.url,
            isFavorite: Boolean(file.isFavorite || (file.favorites && file.favorites.length > 0)),
            folderId: file.folderId || null,
          };
        });

        setFiles(formattedFiles);
      } else {
        throw new Error("Could not load files");
      }
    } catch (error: any) {
      console.error("Error fetching files:", error);
      throw error;
    }
  }, [currentFolderId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchFolders(), fetchFiles()]);
    } catch (err: any) {
      setError(err?.message || "Failed to load directory items. Please check connection.");
    } finally {
      setLoading(false);
    }
  }, [fetchFolders, fetchFiles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real Upload via XMLHttpRequest for genuine 0-100% progress tracking
  const uploadSingleFile = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolderId) {
        formData.append("folderId", currentFolderId);
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/backend/files/upload");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress({ fileName: file.name, percent });
        }
      };

      xhr.onload = () => {
        setUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const uploadedName = data.file?.originalName || data.file?.name || file.name;
            toast.success(`"${uploadedName}" uploaded successfully!`);
            fetchFiles();
            resolve();
          } catch {
            fetchFiles();
            resolve();
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            toast.error(errData.message || "Upload failed");
          } catch {
            toast.error("Upload failed");
          }
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => {
        setUploadProgress(null);
        toast.error("Network error during file upload");
        reject(new Error("Network error"));
      };

      xhr.send(formData);
    });
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    for (const file of droppedFiles) {
      try {
        await uploadSingleFile(file);
      } catch (err) {
        console.error("Drop upload error:", err);
      }
    }
  };

  // File input change handler
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadSingleFile(file);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Toggle Favorite for File
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

  // Toggle Favorite for Folder
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

  // Create Folder
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
          isFavorite: false,
          parentId: currentFolderId || null,
        };
        setFolders([newFolder, ...folders]);
        toast.success(`Folder "${name}" created successfully!`);
      } else {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        toast.error(errorMessage || "Could not create folder.");
      }
    } catch {
      toast.error("Could not reach the backend. Is NestJS running?");
    }
  };

  // Delete Folder
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
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        await fetch(`/api/backend/folders/${targetId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Error soft-deleting folder:", error);
    }
  };

  // Navigation
  const handleFolderClick = (folder: FolderItem) => {
    router.push(`/files/${folder.id}`);
  };

  // Global Search Effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`/api/backend/search?q=${encodeURIComponent(trimmed)}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const backendFolders = data.folders || [];
          const formattedFolders: FolderItem[] = backendFolders.map((f: any) => ({
            id: f.id,
            name: f.name,
            itemCount: f.itemCount || 0,
            size: f.size || "0 KB",
            updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : "Just now",
            isFavorite: Boolean(f.isFavorite),
            parentId: f.parentId || null,
          }));

          const backendFiles = data.files || [];
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
              rawSize: file.size,
              updatedAt: file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : "Just now",
              url: file.url,
              isFavorite: Boolean(file.isFavorite),
              folderId: file.folderId || null,
            };
          });

          setSearchResults({ folders: formattedFolders, files: formattedFiles });
        }
      } catch (err) {
        console.error("Error searching:", err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredFolders = folders.filter((folder: any) => {
    const matchesSearch = folder.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const folderParentId = folder.parentId || folder.parent_id || null;
    const matchesParent = currentFolderId
      ? folderParentId === currentFolderId
      : !folderParentId;

    return matchesSearch && (searchQuery ? true : matchesParent);
  });

  const filteredFiles = files.filter((f: any) => {
    const matchesSearch = f.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = currentFolderId
      ? f.folderId === currentFolderId
      : !f.folderId;
    return matchesSearch && (searchQuery ? true : (f.folderId !== undefined ? matchesFolder : true));
  });

  const displayedFolders = searchResults ? searchResults.folders : filteredFolders;
  const displayedFiles = searchResults ? searchResults.files : filteredFiles;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full bg-white border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs relative transition-all duration-200 ${
        isDragging
          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20"
          : "border-slate-200"
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center pointer-events-none border-2 border-dashed border-blue-500">
          <CloudUpload className="h-12 w-12 text-blue-600 mb-2 animate-bounce" />
          <h3 className="text-base font-bold text-slate-900">Drop files here to upload</h3>
          <p className="text-xs text-slate-500 mt-1">
            Files will be uploaded to {currentFolderId ? "this folder" : "root folder"}
          </p>
        </div>
      )}

      {/* Upload Progress Bar Banner */}
      {uploadProgress && (
        <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 shadow-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900 flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="truncate max-w-[300px]">Uploading: {uploadProgress.fileName}</span>
            </span>
            <span className="font-bold text-blue-600">{uploadProgress.percent}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Explorer Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {currentFolderId ? "Folder Contents" : "My Files"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your folders, uploaded documents, and digital assets.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search in files..."
              aria-label="Search files and folders"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>

          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Upload Button */}
          <button
            onClick={() => document.getElementById("fileInput")?.click()}
            className="flex items-center space-x-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Upload File</span>
          </button>

          {/* New Folder Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>New Folder</span>
          </button>

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

      {/* Error State Banner */}
      {error && (
        <ErrorState
          title="Could not load contents"
          message={error}
          onRetry={loadData}
        />
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
            <FolderGridSkeleton count={4} />
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
            {viewMode === "list" ? (
              <FileTableSkeleton count={6} />
            ) : (
              <FileGridSkeleton count={6} />
            )}
          </div>
        </div>
      ) : displayedFolders.length === 0 && displayedFiles.length === 0 ? (
        <EmptyState
          icon={currentFolderId ? Folder : FolderPlus}
          title={
            searchQuery
              ? `No items matching "${searchQuery}"`
              : currentFolderId
              ? "This folder is empty"
              : "No files or folders yet"
          }
          description={
            searchQuery
              ? "Check for typos or try searching with different keywords."
              : currentFolderId
              ? "Drop files here or click Upload to add items into this directory."
              : "Start organizing your cloud storage by uploading files or creating a new folder."
          }
          actionText={searchQuery ? undefined : "Upload File"}
          onAction={searchQuery ? undefined : () => document.getElementById("fileInput")?.click()}
        />
      ) : (
        <>
      {/* Folders Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Folders ({displayedFolders.length})
        </h2>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedFolders.map((folder) => (
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

                  <div className={`flex items-center space-x-0.5 shrink-0 transition-opacity z-10 relative ${folder.isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {/* Share Folder */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareTarget({ folder });
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                      title="Share Folder"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>

                    {/* Star Folder */}
                    <button
                      onClick={(e) => toggleFavoriteFolder(folder.id, e)}
                      className={`p-1 transition-colors rounded ${
                        folder.isFavorite
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
                      }`}
                      title={folder.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Star className={`h-4 w-4 ${folder.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>

                    {/* Delete Folder */}
                    <button
                      onClick={(e) => confirmDeleteFolder(folder, e)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
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

            {displayedFolders.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                {searchQuery ? `No folders matching "${searchQuery}".` : "No folders found in this directory."}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {displayedFolders.map((folder) => (
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareTarget({ folder });
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Share Folder"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => toggleFavoriteFolder(folder.id, e)}
                        className={`p-1 rounded transition-colors ${
                          folder.isFavorite
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-400 hover:text-amber-500"
                        }`}
                        title={folder.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Star className={`h-4 w-4 ${folder.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => confirmDeleteFolder(folder, e)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete Folder"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {displayedFolders.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  {searchQuery ? `No folders matching "${searchQuery}".` : "No folders found."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Files ({displayedFiles.length})
        </h2>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedFiles.map((file) => (
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

                  <div className={`flex items-center space-x-0.5 shrink-0 transition-opacity ${file.isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {/* Preview Button */}
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

                    {/* Rename File */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToRename(file);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                      title="Rename File"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Move File */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToMove(file);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                      title="Move File"
                    >
                      <FolderInput className="h-4 w-4" />
                    </button>

                    {/* Copy File */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToCopy(file);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                      title="Copy File"
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareTarget({ file });
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      title="Share File"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>

                    {/* Star Button */}
                    <button
                      onClick={(e) => toggleFavoriteFile(file.id, e)}
                      className={`p-1 rounded transition-colors ${
                        file.isFavorite
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-400 hover:text-amber-500"
                      }`}
                      title={file.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Star className={`h-4 w-4 ${file.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>

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
                        className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                        title="Download File"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}

                    {/* Delete Button (Soft Delete) */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setFiles((prev) => prev.filter((f) => f.id !== file.id));
                        toast.info(`"${file.name}" moved to Trash`);

                        try {
                          const token = getAuthToken();
                          const res = await fetch(`/api/backend/files/${file.id}/trash`, {
                            method: "PATCH",
                            headers: { Authorization: `Bearer ${token}` },
                          });

                          if (!res.ok) {
                            await fetch(`/api/backend/files/${file.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
                            });
                          }
                        } catch (err) {
                          console.error("Error soft-deleting file:", err);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Move to Trash"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Updated</span>
                  <span>{file.updatedAt}</span>
                </div>
              </div>
            ))}

            {displayedFiles.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                {searchQuery ? `No files matching "${searchQuery}".` : "No files uploaded yet. Drag & drop files or click Upload File."}
              </div>
            )}
          </div>
        ) : (
          /* Table / List View */
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 w-28">Type</th>
                    <th className="py-3 px-4 w-28">Size</th>
                    <th className="py-3 px-4 w-32">Updated</th>
                    <th className="py-3 px-4 w-48 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {displayedFiles.map((file) => (
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
                            onClick={() => setFileToRename(file)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setFileToMove(file)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded transition-colors"
                            title="Move"
                          >
                            <FolderInput className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setFileToCopy(file)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded transition-colors"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setShareTarget({ file })}
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

                          <button
                            onClick={async () => {
                              setFiles((prev) => prev.filter((f) => f.id !== file.id));
                              toast.info(`"${file.name}" moved to Trash`);
                              try {
                                const token = getAuthToken();
                                await fetch(`/api/backend/files/${file.id}/trash`, {
                                  method: "PATCH",
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {displayedFiles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-slate-500">
                        {searchQuery ? `No files matching "${searchQuery}".` : "No files uploaded yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateFolder}
      />

      {/* Rename File Modal */}
      <RenameFileModal
        isOpen={!!fileToRename}
        onClose={() => setFileToRename(null)}
        file={fileToRename}
        onSuccess={fetchFiles}
      />

      {/* Move File Modal */}
      <MoveFileModal
        isOpen={!!fileToMove}
        onClose={() => setFileToMove(null)}
        file={fileToMove}
        onSuccess={() => {
          fetchFiles();
          fetchFolders();
        }}
      />

      {/* Copy File Modal */}
      <CopyFileModal
        isOpen={!!fileToCopy}
        onClose={() => setFileToCopy(null)}
        file={fileToCopy}
        onSuccess={fetchFiles}
      />

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

      {/* Share Modal (Files & Folders) */}
      <ShareFileModal
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        file={shareTarget?.file}
        folder={shareTarget?.folder}
      />
    </div>
  );
}