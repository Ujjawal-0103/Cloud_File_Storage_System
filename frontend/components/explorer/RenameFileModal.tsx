"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Loader2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/Toast";

interface RenameFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: { id: string; name: string } | null;
  onSuccess: (newName: string) => void;
}

export default function RenameFileModal({
  isOpen,
  onClose,
  file,
  onSuccess,
}: RenameFileModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      setName(file.name);
      setError(null);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("File name cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      const res = await fetch(`/api/backend/files/${file.id}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to rename file");
      }

      toast.success(`Renamed to "${trimmed}"`);
      onSuccess(trimmed);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to rename file");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename File"
      description="Enter a new display name for this file"
      icon={<Edit2 className="h-5 w-5" />}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            File Name
          </label>
          <input
            type="text"
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
          />
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
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Name</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
