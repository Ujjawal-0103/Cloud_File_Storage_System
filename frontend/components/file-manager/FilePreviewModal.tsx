"use client";

import React from "react";
import { X, Download, FileText, Image as ImageIcon, FileCode } from "lucide-react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: { name: string; type: string; size: string; url?: string } | null;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
}: FilePreviewModalProps) {
  if (!isOpen || !file) return null;

  const handleDownload = () => {
    // In a real app, trigger actual file download here
    alert(`Downloading ${file.name}...`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#131728] border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 p-4">
          <div className="flex items-center space-x-3 truncate pr-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              {file.type === "image" ? <ImageIcon className="h-5 w-5" /> : file.type === "code" ? <FileCode className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-lg font-semibold text-white truncate">{file.name}</h3>
              <p className="text-xs text-slate-400">{file.size} • {file.type.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Preview Area */}
        <div className="flex-1 bg-[#0B0E17] p-8 flex items-center justify-center min-h-[300px]">
          {file.type === "image" ? (
            <div className="relative w-full h-full flex items-center justify-center text-slate-500 flex-col space-y-4">
              <ImageIcon className="h-24 w-24 opacity-20" />
              <p className="text-sm">Image Preview Placeholder</p>
            </div>
          ) : (
            <div className="w-full h-full bg-[#131728] border border-slate-800 rounded-xl p-6 text-slate-300 font-mono text-sm overflow-auto">
              {`// Previewing contents of ${file.name}\n\nFile size: ${file.size}\nType: ${file.type}\n\n[Content blocked or not rendering in preview mode...]`}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 border-t border-slate-800/80 p-4 bg-[#131728]">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/60 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-purple-600/20 hover:opacity-95 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}