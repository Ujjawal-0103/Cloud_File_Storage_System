"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Share2,
  X,
  Mail,
  Eye,
  Edit3,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Link as LinkIcon,
  Copy,
  Clock,
  Folder,
  FileText,
} from "lucide-react";
import { shareFileSchema, ShareFileFormValues } from "@/lib/validations/sharing";
import { shareFile, shareFolder, createPublicShare } from "@/lib/api/sharing";
import { useToast } from "@/components/ui/Toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: {
    id: string;
    name: string;
    size?: string | number;
  } | null;
  folder?: {
    id: string;
    name: string;
  } | null;
  onSuccess?: () => void;
}

export default function ShareFileModal({
  isOpen,
  onClose,
  file,
  folder,
  onSuccess,
}: ShareModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"private" | "public">("private");
  const [serverError, setServerError] = useState<string | null>(null);

  // Public link state
  const [expiresInHours, setExpiresInHours] = useState<number | undefined>(undefined);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedPublicUrl, setGeneratedPublicUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShareFileFormValues>({
    resolver: zodResolver(shareFileSchema),
    defaultValues: {
      email: "",
      permission: "VIEW",
    },
  });

  const selectedPermission = watch("permission");

  const target = file || folder;
  const isFolder = !!folder;

  if (!isOpen || !target) return null;

  const handleClose = () => {
    reset();
    setServerError(null);
    setGeneratedPublicUrl(null);
    onClose();
  };

  const onSubmit = async (values: ShareFileFormValues) => {
    try {
      setServerError(null);
      if (isFolder && folder) {
        await shareFolder(folder.id, {
          email: values.email.trim(),
          permission: values.permission,
        });
        toast.success(
          `Folder shared with ${values.email} as ${values.permission}`,
          "Folder Shared"
        );
      } else if (file) {
        await shareFile(file.id, {
          email: values.email.trim(),
          permission: values.permission,
        });
        toast.success(
          `File shared with ${values.email} as ${values.permission}`,
          "File Shared"
        );
      }
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.message || "Failed to share. Please try again.";
      setServerError(msg);
    }
  };

  const handleCreatePublicLink = async () => {
    try {
      setIsGeneratingLink(true);
      setServerError(null);

      const res = await createPublicShare({
        fileId: file?.id,
        folderId: folder?.id,
        expiresInHours: expiresInHours || undefined,
      });

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = `${origin}/public/share/${res.publicToken}`;
      setGeneratedPublicUrl(fullUrl);
      toast.success("Public share link created successfully!");
    } catch (err: any) {
      setServerError(err.message || "Failed to create public link.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedPublicUrl) {
      navigator.clipboard.writeText(generatedPublicUrl);
      toast.success("Public link copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl transition-all relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              {isFolder ? <Folder className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Share {isFolder ? "Folder" : "File"}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">
                {target.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab("private")}
            className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-all ${
              activeTab === "private"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Invite Collaborator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("public")}
            className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-all ${
              activeTab === "public"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Public Share Link
          </button>
        </div>

        {/* Server Error Banner */}
        {serverError && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-red-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{serverError}</span>
          </div>
        )}

        {/* Private Sharing Form */}
        {activeTab === "private" && (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* Recipient Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Recipient Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  autoFocus
                  placeholder="colleague@example.com"
                  disabled={isSubmitting}
                  {...register("email")}
                  className={`w-full rounded-xl bg-white border pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Permission Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Permission Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("permission", "VIEW")}
                  disabled={isSubmitting}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedPermission === "VIEW"
                      ? "bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-900">VIEW</span>
                    </div>
                    {selectedPermission === "VIEW" && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Can view and download {isFolder ? "folder contents" : "file"}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("permission", "EDIT")}
                  disabled={isSubmitting}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedPermission === "EDIT"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <Edit3 className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-900">EDIT</span>
                    </div>
                    {selectedPermission === "EDIT" && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Can view, download, and manage contents
                  </p>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share Access</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Public Link Section */}
        {activeTab === "public" && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Link Expiration</span>
              </label>
              <select
                value={expiresInHours || ""}
                onChange={(e) => setExpiresInHours(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">Never Expires</option>
                <option value="24">Expires in 24 hours</option>
                <option value="168">Expires in 7 days</option>
                <option value="720">Expires in 30 days</option>
              </select>
            </div>

            {generatedPublicUrl ? (
              <div className="space-y-2.5 pt-2">
                <label className="block text-xs font-semibold text-emerald-700">
                  Public Share Link Active
                </label>
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <input
                    type="text"
                    readOnly
                    value={generatedPublicUrl}
                    className="flex-1 bg-transparent text-xs text-slate-800 outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center space-x-1 bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Anyone with this link can view and download this {isFolder ? "folder" : "file"}.
                </p>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreatePublicLink}
                  disabled={isGeneratingLink}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-all"
                >
                  {isGeneratingLink ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating Link...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>Create Public Link</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
