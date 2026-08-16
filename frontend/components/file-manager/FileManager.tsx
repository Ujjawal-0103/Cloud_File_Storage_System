"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, File as FileIcon, Download, Eye, Trash2, Image as ImageIcon, FileText, FileCode, CheckCircle2 } from "lucide-react";
import FilePreviewModal from "./FilePreviewModal";

interface FileItem {
  id: string;
  name: string;
  type: "image" | "code" | "document" | string;
  size: string;
  uploadDate: string;
}

export default function FileManager() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([
    { id: "1", name: "Project_Proposal_v2.pdf", type: "document", size: "2.4 MB", uploadDate: "Oct 24, 2023" },
    { id: "2", name: "hero-background.png", type: "image", size: "4.1 MB", uploadDate: "Oct 23, 2023" },
    { id: "3", name: "utils.ts", type: "code", size: "12 KB", uploadDate: "Oct 22, 2023" },
  ]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (uploadedFiles: File[]) => {
    const newFiles = uploadedFiles.map((f) => ({
      id: Date.now().toString() + Math.random().toString(),
      name: f.name,
      type: f.type.includes("image") ? "image" : f.name.endsWith(".ts") || f.name.endsWith(".js") ? "code" : "document",
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      uploadDate: "Just now",
    }));
    setFiles((prev) => [...newFiles, ...prev]);
  };

  // Actions
  const openPreview = (file: FileItem) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0B0E17] text-slate-200 p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">File Manager</h1>
        <p className="text-sm text-slate-400 mt-1">Upload, preview, and manage your files securely.</p>
      </div>

      {/* Upload Section */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-purple-500 bg-purple-500/10"
            : "border-slate-700 bg-[#131728] hover:border-purple-500/50 hover:bg-[#161B30]"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
          multiple
        />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 mb-4">
          <UploadCloud className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {isDragging ? "Drop files here" : "Click or drag files to upload"}
        </h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.
        </p>
      </div>

      {/* File List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Recent Uploads ({files.length})
          </h2>
        </div>

        <div className="rounded-2xl bg-[#131728] border border-slate-800/80 overflow-hidden shadow-md">
          {files.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No files uploaded yet.</div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#161B30] transition-colors gap-4"
                >
                  {/* File Info */}
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-cyan-400">
                      {file.type === "image" ? <ImageIcon className="h-5 w-5" /> : file.type === "code" ? <FileCode className="h-5 w-5 text-yellow-400" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{file.size} • {file.uploadDate}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => openPreview(file)}
                      className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                      onClick={() => alert(`Downloading ${file.name}`)}
                      className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="flex items-center space-x-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal Integration */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={selectedFile}
      />
    </div>
  );
}