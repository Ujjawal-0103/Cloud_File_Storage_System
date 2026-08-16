"use client";

import React, { useState } from "react";
import { FolderPlus, X } from "lucide-react";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (folderName: string) => void;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreate,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      setFolderName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#131728] border border-slate-800 p-6 shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <FolderPlus className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Create New Folder</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Design Assets, Invoices..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full rounded-xl bg-[#0B0E17] border border-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-600/20 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}