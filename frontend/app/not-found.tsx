import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="CloudRage"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
            Error 404
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            The file, folder, or page you were looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center space-x-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
