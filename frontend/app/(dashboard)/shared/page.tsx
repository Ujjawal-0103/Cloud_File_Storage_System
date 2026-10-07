"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Search,
  FileText,
  FileImage,
  FileCode,
  Download,
  RefreshCw,
  Eye,
  ChevronDown,
  Loader2,
  UserCheck,
  Send,
  Inbox,
  UserMinus,
  Folder,
  AlertCircle,
  X,
} from "lucide-react";
import {
  getReceivedShares,
  getSentShares,
  updateSharePermission,
  getFileAccess,
} from "@/lib/api/sharing";
import { ReceivedShare, SentShare, Permission, FileAccessResult } from "@/types/sharing";
import PermissionBadge from "@/components/sharing/PermissionBadge";
import RevokeShareModal from "@/components/sharing/RevokeShareModal";
import { useToast } from "@/components/ui/Toast";
import { FileTableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function SharedPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [receivedShares, setReceivedShares] = useState<ReceivedShare[]>([]);
  const [sentShares, setSentShares] = useState<SentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission update state per share
  const [updatingShareId, setUpdatingShareId] = useState<string | null>(null);

  // Revoke modal state
  const [shareToRevoke, setShareToRevoke] = useState<{
    id: string;
    fileName: string;
    recipientName: string;
    recipientEmail: string;
  } | null>(null);

  // File preview modal
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    mimeType?: string;
  } | null>(null);

  // Access verification info modal
  const [accessModal, setAccessModal] = useState<FileAccessResult | null>(null);
  const [checkingAccessId, setCheckingAccessId] = useState<string | null>(null);

  // Load data
  const loadShares = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [received, sent] = await Promise.all([
        getReceivedShares(),
        getSentShares(),
      ]);

      setReceivedShares(received);
      setSentShares(sent);
    } catch (err: any) {
      console.error("Failed to load shares:", err);
      setError(err?.message || "Failed to load shared items. Please log in.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  // Handle permission change (Sent shares only)
  const handlePermissionChange = async (
    shareId: string,
    newPermission: Permission
  ) => {
    try {
      setUpdatingShareId(shareId);
      await updateSharePermission(shareId, { permission: newPermission });
      setSentShares((prev) =>
        prev.map((s) =>
          s.id === shareId ? { ...s, permission: newPermission } : s
        )
      );
      toast.success(
        `Permission updated to ${newPermission}`,
        "Permission Changed"
      );
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to update permission",
        "Update Failed"
      );
    } finally {
      setUpdatingShareId(null);
    }
  };

  // Check file access via GET /sharing/files/:fileId
  const handleCheckAccess = async (fileId: string) => {
    try {
      setCheckingAccessId(fileId);
      const access = await getFileAccess(fileId);
      setAccessModal(access);
    } catch (err: any) {
      toast.error(err?.message || "Access denied or file not found");
    } finally {
      setCheckingAccessId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getFileIcon = (mimeType?: string, fileName?: string) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (
      mimeType?.startsWith("image/") ||
      ["png", "jpg", "jpeg", "svg", "webp"].includes(ext || "")
    ) {
      return <FileImage className="h-5 w-5 text-pink-500" />;
    }
    if (
      mimeType?.includes("javascript") ||
      mimeType?.includes("json") ||
      ["js", "ts", "tsx", "html", "css", "json", "py"].includes(ext || "")
    ) {
      return <FileCode className="h-5 w-5 text-amber-500" />;
    }
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  // Filter lists
  const query = searchQuery.toLowerCase().trim();

  const filteredReceived = receivedShares.filter((share) => {
    const name = share.file?.name || share.folder?.name || "";
    const senderEmail = share.sharedBy?.email || "";
    const senderName = share.sharedBy?.name || "";
    return (
      name.toLowerCase().includes(query) ||
      senderEmail.toLowerCase().includes(query) ||
      senderName.toLowerCase().includes(query)
    );
  });

  const filteredSent = sentShares.filter((share) => {
    const name = share.file?.name || share.folder?.name || "";
    const recipientEmail = share.sharedWith?.email || (share.isPublic ? "public link" : "");
    const recipientName = share.sharedWith?.name || "";
    return (
      name.toLowerCase().includes(query) ||
      recipientEmail.toLowerCase().includes(query) ||
      recipientName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-slate-800 min-h-[600px]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Shared Files
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage files shared with you and track assets you have shared with others.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by file or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={() => loadShares(true)}
            disabled={refreshing || loading}
            title="Refresh shared items"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin text-blue-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "received"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Shared with Me</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "received"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {receivedShares.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sent")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "sent"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Shared by Me</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "sent"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {sentShares.length}
          </span>
        </button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <ErrorState message={error} onRetry={() => loadShares()} />
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="py-2">
          <FileTableSkeleton count={5} />
        </div>
      )}

      {/* TAB 1: RECEIVED SHARES (Shared with Me) */}
      {!loading && !error && activeTab === "received" && (
        <>
          {filteredReceived.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={searchQuery ? "No matching shared files" : "No files shared with you yet"}
              description={
                searchQuery
                  ? `No shared files or collaborators matched "${searchQuery}".`
                  : "When someone shares a file or folder with your email address, it will appear here with VIEW or EDIT permissions."
              }
              actionLabel={searchQuery ? "Clear Search" : undefined}
              onAction={searchQuery ? () => setSearchQuery("") : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredReceived.map((share) => (
                <div
                  key={share.id}
                  className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* File & Sender Info */}
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {share.folder ? (
                        <Folder className="h-5 w-5 text-blue-600" />
                      ) : (
                        getFileIcon(share.file?.mimeType || "", share.file?.name || "")
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate max-w-xs md:max-w-md">
                          {share.file?.name || share.folder?.name || "Shared Item"}
                        </h3>
                        <PermissionBadge permission={share.permission} size="sm" />
                      </div>

                      <div className="mt-0.5 flex items-center space-x-2 text-xs text-slate-500 flex-wrap gap-y-1">
                        <span>
                          Shared by{" "}
                          <span className="text-slate-800 font-medium">
                            {share.sharedBy.name || share.sharedBy.email}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{share.file ? formatFileSize(share.file.size) : (share.folder?.size || "Folder")}</span>
                        <span>•</span>
                        <span>{formatDate(share.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    {share.file && (
                      <button
                        onClick={() => handleCheckAccess(share.file!.id)}
                        disabled={checkingAccessId === share.file!.id}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition-colors flex items-center space-x-1.5 font-medium"
                        title="Verify your access permission"
                      >
                        {checkingAccessId === share.file!.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        )}
                        <span>Check Access</span>
                      </button>
                    )}

                    {share.file?.url && (
                      <button
                        onClick={() =>
                          setPreviewFile({
                            name: share.file!.name,
                            url: share.file!.url,
                            mimeType: share.file!.mimeType,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition-colors flex items-center space-x-1.5 font-medium"
                        title="Preview File"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Preview</span>
                      </button>
                    )}

                    {share.file?.url && (
                      <a
                        href={
                          share.file!.url.includes("/upload/")
                            ? share.file!.url.replace(
                                "/upload/",
                                "/upload/fl_attachment/"
                              )
                            : share.file!.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        download={share.file!.name}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
                        title="Download File"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: SENT SHARES (Shared by Me) */}
      {!loading && !error && activeTab === "sent" && (
        <>
          {filteredSent.length === 0 ? (
            <EmptyState
              icon={Send}
              title={searchQuery ? "No matching sent shares" : "You haven't shared any files yet"}
              description={
                searchQuery
                  ? `No shared files or recipients matched "${searchQuery}".`
                  : "To share a file or folder, select 'Share' from the context menu in My Files."
              }
              actionLabel={searchQuery ? "Clear Search" : undefined}
              onAction={searchQuery ? () => setSearchQuery("") : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredSent.map((share) => (
                <div
                  key={share.id}
                  className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* File/Folder & Recipient Info */}
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {share.folder ? (
                        <Folder className="h-5 w-5 text-blue-600" />
                      ) : (
                        getFileIcon(share.file?.mimeType || "", share.file?.name || "")
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate max-w-xs md:max-w-md">
                          {share.file?.name || share.folder?.name || "Shared Item"}
                        </h3>
                        <PermissionBadge permission={share.permission} size="sm" />
                      </div>

                      <div className="mt-0.5 flex items-center space-x-2 text-xs text-slate-500 flex-wrap gap-y-1">
                        <span>
                          Shared with{" "}
                          <span className="text-slate-800 font-medium">
                            {share.sharedWith ? (share.sharedWith.name || share.sharedWith.email) : "Public Link"}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{share.file ? formatFileSize(share.file.size) : (share.folder?.size || "Folder")}</span>
                        <span>•</span>
                        <span>{formatDate(share.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Controls: Permission Switcher & Revoke Share */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <div className="relative">
                      <select
                        value={share.permission}
                        disabled={updatingShareId === share.id}
                        onChange={(e) =>
                          handlePermissionChange(
                            share.id,
                            e.target.value as Permission
                          )
                        }
                        className="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-xs text-slate-800 rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:border-blue-600 transition-all cursor-pointer font-medium disabled:opacity-50"
                      >
                        <option value="VIEW">VIEW Permission</option>
                        <option value="EDIT">EDIT Permission</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    {share.file?.url && (
                      <button
                        onClick={() =>
                          setPreviewFile({
                            name: share.file!.name,
                            url: share.file!.url,
                            mimeType: share.file!.mimeType,
                          })
                        }
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
                        title="Preview File"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        setShareToRevoke({
                          id: share.id,
                          fileName: share.file?.name || share.folder?.name || "Shared Item",
                          recipientName: share.sharedWith?.name || "Public",
                          recipientEmail: share.sharedWith?.email || "Public Link",
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-colors flex items-center space-x-1 text-xs font-semibold"
                      title="Revoke Sharing"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Revoke Confirmation Modal */}
      <RevokeShareModal
        isOpen={!!shareToRevoke}
        onClose={() => setShareToRevoke(null)}
        share={shareToRevoke}
        onSuccess={() => {
          if (shareToRevoke) {
            setSentShares((prev) =>
              prev.filter((s) => s.id !== shareToRevoke.id)
            );
          }
        }}
      />

      {/* Access Verification Result Modal */}
      {accessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setAccessModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-xl transition-all relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              File Access Level
            </h3>
            <p className="text-xs text-slate-500 mb-4 truncate">
              {accessModal.file.name}
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-5 flex flex-col items-center space-y-2">
              <span className="text-xs text-slate-500">Your Current Permission:</span>
              <PermissionBadge permission={accessModal.permission} size="md" />
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                {accessModal.permission === "OWNER" &&
                  "You are the owner of this file. You have complete control."}
                {accessModal.permission === "EDIT" &&
                  "You have EDIT permissions. You can view, download, and modify file contents."}
                {accessModal.permission === "VIEW" &&
                  "You have VIEW permissions. You can view and download this file."}
              </p>
            </div>

            <button
              onClick={() => setAccessModal(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-h-full max-w-4xl w-full bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-800 truncate">{previewFile.name}</span>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-[75vh] w-full flex justify-center overflow-auto">
              {previewFile.mimeType?.startsWith("image/") ||
              /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(previewFile.name) ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[70vh] rounded-lg object-contain"
                />
              ) : (
                <iframe
                  src={
                    previewFile.url.toLowerCase().endsWith(".pdf")
                      ? previewFile.url
                      : `${previewFile.url}.pdf`
                  }
                  title={previewFile.name}
                  className="w-full h-[70vh] rounded-lg border-none"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
