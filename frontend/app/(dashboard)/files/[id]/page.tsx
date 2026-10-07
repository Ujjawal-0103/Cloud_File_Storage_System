import React from "react";
import FolderExplorer from "@/components/explorer/FolderExplorer";
import { cookies } from "next/headers";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

// Helper function to trace the folder path
async function getFolderPath(currentId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || "";

    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
    const response = await fetch(`${backendUrl}/folders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      const allFolders = Array.isArray(data) ? data : data.folders || [];

      const path = [];
      let current = allFolders.find((f: any) => f.id === currentId);

      while (current) {
        path.unshift({ id: current.id, name: current.name });
        const parentId = current.parentId || current.parent_id;
        current = allFolders.find((f: any) => f.id === parentId);
      }

      return path;
    }
  } catch (error) {
    console.error("Failed to fetch folders for breadcrumb:", error);
  }
  return [];
}

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const folderId = resolvedParams.id;

  const folderPath = await getFolderPath(folderId);

  return (
    <div className="w-full space-y-4">
      {/* Clean Dynamic Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-slate-500 py-1">
        <Link
          href="/files"
          className="flex items-center space-x-1 hover:text-blue-600 transition-colors font-medium text-slate-600"
        >
          <Home className="h-3.5 w-3.5" />
          <span>My Files</span>
        </Link>

        {folderPath.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {index === folderPath.length - 1 ? (
              <span className="text-slate-900 font-semibold truncate max-w-[200px]">
                {folder.name}
              </span>
            ) : (
              <Link
                href={`/files/${folder.id}`}
                className="hover:text-blue-600 transition-colors truncate max-w-[150px]"
              >
                {folder.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      <FolderExplorer key={folderId} currentFolderId={folderId} />
    </div>
  );
}