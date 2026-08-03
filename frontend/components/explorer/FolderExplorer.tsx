"use client";

import React, { useState } from "react";
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
  type: "image" | "code" | "document";
  size: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export default function FolderExplorer() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>(["Root"]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock State for Folders & Files
  const [folders, setFolders] = useState<FolderItem[]>([
    { id: "1", name: "Project Documents", itemCount: 12, size: "45 MB", updatedAt: "2 hours ago" },
    { id: "2", name: "UI Design Specs", itemCount: 8, size: "128 MB", updatedAt: "Yesterday" },
    { id: "3", name: "Backend Architecture", itemCount: 5, size: "12 MB", updatedAt: "3 days ago" },
  ]);

  const [files, setFiles] = useState<FileItem[]>([
    { id: "101", name: "Dashboard_Wireframe.png", type: "image", size: "3.4 MB", updatedAt: "1 hour ago" },
    { id: "102", name: "schema.prisma", type: "code", size: "14 KB", updatedAt: "4 hours ago" },
    { id: "103", name: "Sprint_3_Scope.pdf", type: "document", size: "1.2 MB", updatedAt: "2 days ago" },
  ]);

  const handleCreateFolder = (name: string) => {
    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name,
      itemCount: 0,
      size: "0 KB",
      updatedAt: "Just now",
    };
    setFolders([newFolder, ...folders]);
  };

  const handleDeleteFolder = (id: string) => {
    setFolders(folders.filter((f) => f.id !== id));
  };

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0E17] text-slate-200 p-6 space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Folder Explorer</h1>
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
            {currentPath.map((folder, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="h-3 w-3 text-slate-600" />}
                <span className="hover:text-purple-400 cursor-pointer transition-colors">
                  {folder}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Actions Header */}
        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search folders & files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-[#131728] border border-slate-800 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* New Folder Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-purple-600/20 hover:opacity-95 transition-all"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
          </button>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-[#131728] border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-purple-600/30 text-purple-300" : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-purple-600/30 text-purple-300" : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folders Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Folders ({filteredFolders.length})
        </h2>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="group relative rounded-2xl bg-[#131728] border border-slate-800/80 p-4 hover:border-purple-500/40 hover:bg-[#161B30] transition-all duration-200 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                      <Folder className="h-6 w-6 fill-purple-500/20" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {folder.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{folder.itemCount} items</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-opacity"
                    title="Delete Folder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{folder.size}</span>
                  <span>{folder.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="rounded-2xl bg-[#131728] border border-slate-800/80 overflow-hidden shadow-md">
            <div className="divide-y divide-slate-800/80">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-4 hover:bg-[#161B30] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-purple-400 fill-purple-500/20" />
                    <span className="font-medium text-sm text-white">{folder.name}</span>
                  </div>
                  <div className="flex items-center space-x-8 text-xs text-slate-400">
                    <span>{folder.itemCount} items</span>
                    <span>{folder.size}</span>
                    <span>{folder.updatedAt}</span>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Files ({filteredFiles.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-2xl bg-[#131728] border border-slate-800/80 p-4 hover:border-cyan-500/40 hover:bg-[#161B30] transition-all duration-200 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                    {file.type === "image" && <FileImage className="h-5 w-5" />}
                    {file.type === "code" && <FileCode className="h-5 w-5" />}
                    {file.type === "document" && <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-cyan-300 transition-colors">
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{file.size}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 text-slate-400 hover:text-cyan-400">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-slate-400 hover:text-yellow-400">
                    <Star className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated</span>
                <span>{file.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Integration */}
      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateFolder}
      />
    </div>
  );
}