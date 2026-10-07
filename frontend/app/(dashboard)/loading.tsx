import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-[450px] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
      <p className="text-xs font-semibold text-slate-800 tracking-wide">Loading workspace...</p>
      <p className="text-[11px] text-slate-500">Retrieving cloud files and directories</p>
    </div>
  );
}
