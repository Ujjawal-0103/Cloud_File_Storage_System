"use client";

import React, { useState, useEffect } from "react";
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
  FileImage,
  FileCode,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

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

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // 1. Fetch Favorite Folders
  useEffect(() => {
    const fetchFavoriteFolders = async () => {
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
        }
      } catch (error) {
        console.error("Error fetching favorite folders:", error);
      }
    };

    fetchFavoriteFolders();
  }, []);

  // 2. Fetch Favorite Files
  useEffect(() => {
    const fetchFavoriteFiles = async () => {
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
          const favList = Array.isArray(favData) ? favData : favData.favorites || [];

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
      } catch (error) {
        console.error("Error fetching favorite files:", error);
      }
    };

    fetchFavoriteFiles();
  }, []);

  // 3. Toggle Favorite for File
  const toggleFavoriteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetFile = files.find((f) => f.id === id);
    const newFavoriteState = !targetFile?.isFavorite;

    // Immediate optimistic state update
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

    // Immediate optimistic state update
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
    <div className="w-full bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] rounded-[24px] p-8 space-y-6 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Favorites</h1>
          <p className="text-xs text-[#7D879C] mt-1">Your starred folders and files for quick access.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
            <input
              type="text"
              placeholder="Search favorites..."
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

      {/* Folders Section */}
      {folders.length > 0 && (
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:scale-105 transition-transform">
                        <Folder className="h-6 w-6 fill-[#8B5CF6]/20" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#C4B5FD] transition-colors" title={folder.name}>
                          {folder.name}
                        </h3>
                        <p className="text-xs text-[#7D879C] mt-0.5 truncate">{folder.itemCount || 0} items</p>
                      </div>
                    </div>

                    <div className={`flex items-center space-x-0.5 shrink-0 transition-opacity z-10 relative ${folder.isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <button
                        onClick={(e) => toggleFavoriteFolder(folder.id, e)}
                        className={`p-1 transition-colors ${
                          folder.isFavorite
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-[#7D879C] hover:text-yellow-400"
                        }`}
                        title={folder.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Star className={`h-4 w-4 ${folder.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => confirmDeleteFolder(folder, e)}
                        className="p-1 text-[#7D879C] hover:text-red-400 transition-colors"
                        title="Delete Folder"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#7D879C]">
                    <span>{folder.size || "0 KB"}</span>
                    <span>{folder.updatedAt || "Just now"}</span>
                  </div>
                </div>
              ))}

              {filteredFolders.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
                  No matching favorite folders found.
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => toggleFavoriteFolder(folder.id, e)}
                          className={`transition-colors z-10 relative ${
                            folder.isFavorite
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-[#7D879C] hover:text-yellow-400"
                          }`}
                          title={folder.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        >
                          <Star className={`h-4 w-4 ${folder.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => confirmDeleteFolder(folder, e)}
                          className="text-[#7D879C] hover:text-red-400 transition-colors z-10 relative"
                          title="Delete Folder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFolders.length === 0 && (
                  <div className="p-8 text-center text-sm text-[#7D879C]">
                    No matching favorite folders found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Files Section */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7D879C]">
          Files ({filteredFiles.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-[#06B6D4]/40 hover:bg-white/10 transition-all duration-200 shadow-md"
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

                <div className={`flex items-center space-x-0.5 shrink-0 transition-opacity ${file.isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
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

                  {/* Star Button */}
                  <button
                    onClick={(e) => toggleFavoriteFile(file.id, e)}
                    className={`p-1 transition-colors ${
                      file.isFavorite
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-[#7D879C] hover:text-yellow-400"
                    }`}
                    title={file.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Star className={`h-4 w-4 ${file.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
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
                        toast.error("Error moving file to trash.");
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

          {filteredFiles.length === 0 && folders.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
              <Star className="h-8 w-8 text-[#7D879C]/50 mx-auto mb-3" />
              <p className="font-medium text-white">{searchQuery ? `No favorites matching "${searchQuery}"` : "No favorites yet"}</p>
              <p className="text-xs text-[#7D879C] mt-1">{searchQuery ? "Try searching for a different term." : "Click the star icon on any folder or file to add it to your favorites."}</p>
            </div>
          )}

          {filteredFiles.length === 0 && folders.length > 0 && (
            <div className="col-span-full py-8 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed">
              {searchQuery ? `No favorite files matching "${searchQuery}".` : "No favorite files found."}
            </div>
          )}
        </div>
      </div>

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
          <div className="bg-[rgba(22,27,48,0.95)] border border-white/10 p-6 rounded-2xl shadow-2xl w-[360px] text-center transform scale-100 transition-transform">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Move Folder to Trash?</h3>
            <p className="text-sm text-[#B7C1D8] mb-6">
              <span className="font-semibold text-white">"{folderToDelete.name}"</span> and <span className="text-white font-medium">all subfolders and files inside it</span> will be moved to Trash. You can restore them anytime from the Trash page.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setFolderToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteFolder}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
