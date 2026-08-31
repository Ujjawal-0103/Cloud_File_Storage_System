"use client";

import { useState } from "react";
import { Share2, Users, FileText, Search, Folder } from "lucide-react";

export default function SharedPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="w-full bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] rounded-[24px] p-8 space-y-6 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Shared with Me</h1>
          <p className="text-xs text-[#7D879C] mt-1">Files and folders that other users have shared with you.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
            <input
              type="text"
              placeholder="Search shared items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2 text-xs text-white placeholder-[#7D879C] focus:outline-none focus:border-[#8B5CF6] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="py-16 text-center text-sm text-[#7D879C] bg-white/5 rounded-2xl border border-white/10 border-dashed space-y-3">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] border border-[#8B5CF6]/20">
            <Share2 className="h-6 w-6" />
          </div>
        </div>
        <p className="font-semibold text-white text-base">No shared files yet</p>
        <p className="text-xs text-[#7D879C] max-w-sm mx-auto">
          When someone shares a file or folder with your email, it will appear here for you to view or download.
        </p>
      </div>
    </div>
  );
}
