"use client";

import React, { useState } from "react";
import { UserMinus, X, Loader2 } from "lucide-react";
import { revokeShare } from "@/lib/api/sharing";
import { useToast } from "@/components/ui/Toast";

interface RevokeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  share: {
    id: string;
    fileName: string;
    recipientName: string;
    recipientEmail: string;
  } | null;
  onSuccess: () => void;
}

export default function RevokeShareModal({
  isOpen,
  onClose,
  share,
  onSuccess,
}: RevokeShareModalProps) {
  const { toast } = useToast();
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !share) return null;

  const handleRevoke = async () => {
    try {
      setIsRevoking(true);
      setError(null);
      await revokeShare(share.id);
      toast.success(
        `Access revoked for ${share.recipientEmail}`,
        "Sharing Revoked"
      );
      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to revoke share");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-xl transition-all relative text-center">
        <button
          onClick={onClose}
          disabled={isRevoking}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex justify-center mb-3">
          <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
            <UserMinus className="h-6 w-6" />
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1.5">
          Revoke Access?
        </h3>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Stop sharing <span className="font-semibold text-slate-800">"{share.fileName}"</span> with{" "}
          <span className="font-semibold text-slate-800">{share.recipientEmail}</span>?
        </p>

        <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-5 text-left leading-relaxed">
          Note: This immediately revokes external collaborator access. The original asset in your drive will remain intact.
        </p>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <div className="flex space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isRevoking}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isRevoking}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors text-xs font-semibold inline-flex items-center justify-center space-x-1.5 shadow-xs"
          >
            {isRevoking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Revoking...</span>
              </>
            ) : (
              <span>Revoke Access</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
