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
    <div className="w-full bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] rounded-[24px] p-8 space-y-8 text-slate-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">File Manager</h1>
        <p className="text-sm text-[#B7C1D8] mt-1">Upload, preview, and manage your files securely.</p>
      </div>

      {/* Upload Section */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-[#8B5CF6] bg-[#8B5CF6]/10"
            : "border-white/20 bg-white/5 hover:border-[#8B5CF6]/50 hover:bg-white/10"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
          multiple
        />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] mb-4">
          <UploadCloud className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {isDragging ? "Drop files here" : "Click or drag files to upload"}
        </h3>
        <p className="text-sm text-[#B7C1D8] max-w-sm">
          Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.
        </p>
      </div>

      {/* File List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7D879C]">
            Recent Uploads ({files.length})
          </h2>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-md">
          {files.length === 0 ? (
            <div className="p-8 text-center text-[#7D879C] text-sm">No files uploaded yet.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/5 transition-colors gap-4"
                >
                  {/* File Info */}
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#06B6D4]">
                      {file.type === "image" ? <ImageIcon className="h-5 w-5" /> : file.type === "code" ? <FileCode className="h-5 w-5 text-yellow-400" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</h4>
                      <p className="text-xs text-[#7D879C] mt-0.5">{file.size} • {file.uploadDate}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => openPreview(file)}
                      className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                      onClick={() => alert(`Downloading ${file.name}`)}
                      className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-[#06B6D4] transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="flex items-center space-x-1 rounded-lg p-1.5 text-[#7D879C] hover:bg-white/10 hover:text-red-400 transition-colors"
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