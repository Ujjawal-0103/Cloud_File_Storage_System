import React from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/60 backdrop-blur-xs py-4 px-4 sm:px-6 text-xs text-muted-foreground transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="CloudRage"
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
          />
          <span className="font-semibold text-foreground">CloudRage</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>

        <div className="flex items-center space-x-4 text-[11px]">
          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Systems Normal</span>
          </div>
          <span className="text-border">•</span>
          <span className="text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Encrypted Cloud Storage</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
