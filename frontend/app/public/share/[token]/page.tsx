"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Download,
  FileText,
  FileImage,
  Folder,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import { getPublicShare } from "@/lib/api/sharing";
import { PublicShareResult } from "@/types/sharing";

export default function PublicSharePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [shareData, setShareData] = useState<PublicShareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadPublicShare();
    }
  }, [token]);

  const loadPublicShare = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicShare(token);
      setShareData(data);
    } catch (err: any) {
      setError(err?.message || "This shared link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-lg space-y-6">
        {/* Branding Header */}
        <div className="flex items-center justify-between px-1">
          <Link href="/login" className="flex items-center space-x-2.5 group">
            <Image
              src="/logo.png"
              alt="CloudRage"
              width={36}
              height={36}
              className="h-9 w-9 object-contain shrink-0"
            />
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                CloudRage
              </span>
              <span className="ml-1.5 inline-block text-[10px] font-medium uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                Public Share
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-5">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Retrieving shared content securely...</p>
            </div>
          )}

          {error && !loading && (
            <div className="py-8 text-center space-y-4">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Access Unavailable</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">{error}</p>
              </div>
              <Link
                href="/login"
                className="inline-block px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                Go to CloudRage
              </Link>
            </div>
          )}

          {shareData && !loading && (
            <div className="space-y-5">
              {/* Expiration Banner */}
              {shareData.expiresAt && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>Link Expiration:</span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    {new Date(shareData.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* File Details */}
              {shareData.file && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="h-11 w-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                      {shareData.file.mimeType?.startsWith("image/") ? (
                        <FileImage className="h-5 w-5 text-pink-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{shareData.file.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatFileSize(shareData.file.size)} • Shared by {shareData.sharedBy.name || shareData.sharedBy.email}
                      </p>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {shareData.file.mimeType?.startsWith("image/") && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-white p-2 flex justify-center">
                      <img
                        src={shareData.file.url}
                        alt={shareData.file.name}
                        className="max-h-60 object-contain rounded"
                      />
                    </div>
                  )}

                  {/* Download Button */}
                  {shareData.file.url && (
                    <a
                      href={
                        shareData.file.url.includes("/upload/")
                          ? shareData.file.url.replace("/upload/", "/upload/fl_attachment/")
                          : shareData.file.url
                      }
                      target="_blank"
                      rel="noreferrer"
                      download={shareData.file.name}
                      className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 px-4 text-xs font-semibold text-white shadow-xs transition-all"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>
              )}

              {/* Folder Details */}
              {shareData.folder && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{shareData.folder.name}</h3>
                      <p className="text-xs text-slate-500">
                        Shared folder • {shareData.folder.files?.length || 0} files included
                      </p>
                    </div>
                  </div>

                  {/* Folder Files List */}
                  {shareData.folder.files && shareData.folder.files.length > 0 && (
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white max-h-48 overflow-y-auto">
                      {shareData.folder.files.map((f) => (
                        <div key={f.id} className="flex items-center justify-between p-2.5 text-xs">
                          <span className="truncate max-w-[240px] text-slate-800 font-medium">{f.name}</span>
                          {f.url && (
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-semibold hover:underline"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
