"use client";

import React, { useState, useEffect } from "react";
import { FolderInput, Folder, Home, Loader2, Check } from "lucide-react";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/Toast";

interface MoveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: { id: string; name: string; folderId?: string | null } | null;
  onSuccess: () => void;
}

export default function MoveFileModal({
  isOpen,
  onClose,
  file,
  onSuccess,
}: MoveFileModalProps) {
  const { toast } = useToast();
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      setSelectedFolderId(file.folderId || null);
      loadFolders();
    }
  }, [isOpen, file]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      const res = await fetch("/api/backend/folders", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(Array.isArray(data) ? data : data.folders || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !file) return null;

  const handleMove = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      const res = await fetch(`/api/backend/files/${file.id}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ folderId: selectedFolderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to move file");
      }

      toast.success("File moved successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to move file");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Move File"
      description={`Choose destination directory for "${file.name}"`}
      icon={<FolderInput className="h-5 w-5" />}
      maxWidth="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {/* Root option */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
              selectedFolderId === null
                ? "bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/20 font-medium"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Home className="h-4 w-4 text-blue-600" />
              <span>Root (Home Directory)</span>
            </div>
            {selectedFolderId === null && <Check className="h-4 w-4 text-blue-600" />}
          </button>

          {/* User folders */}
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFolderId(f.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                selectedFolderId === f.id
                  ? "bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/20 font-medium"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Folder className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="truncate max-w-[240px]">{f.name}</span>
              </div>
              {selectedFolderId === f.id && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
            </button>
          ))}

          {folders.length === 0 && !loading && (
            <p className="text-center py-4 text-xs text-slate-500">No other folders available</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Moving...</span>
              </>
            ) : (
              <span>Move Here</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
