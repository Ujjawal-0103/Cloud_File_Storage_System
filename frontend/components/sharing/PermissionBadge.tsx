import React from "react";
import { Eye, Edit3, Crown } from "lucide-react";

interface PermissionBadgeProps {
  permission: "OWNER" | "VIEW" | "EDIT";
  size?: "sm" | "md";
}

export default function PermissionBadge({
  permission,
  size = "md",
}: PermissionBadgeProps) {
  if (permission === "OWNER") {
    return (
      <span
        className={`inline-flex items-center space-x-1 font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 ${
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <Crown className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>Owner</span>
      </span>
    );
  }

  if (permission === "EDIT") {
    return (
      <span
        className={`inline-flex items-center space-x-1 font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <Edit3 className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>EDIT</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center space-x-1 font-medium rounded-md bg-blue-50 text-blue-800 border border-blue-200/80 ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Eye className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>VIEW</span>
    </span>
  );
}
