import React from "react";
import FolderExplorer from "@/components/explorer/FolderExplorer";
import { cookies } from "next/headers";
import Link from "next/link"; // Allows clickable breadcrumbs

// Helper function to trace the folder path
async function getFolderPath(currentId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || "";

    // Fetch ALL folders to reconstruct the path on the frontend
    const response = await fetch(`http://localhost:3000/api/backend/folders`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });

    if (response.ok) {
      const data = await response.json();
      const allFolders = Array.isArray(data) ? data : data.folders || [];
      
      const path = [];
      let current = allFolders.find((f: any) => f.id === currentId);
      
      // Trace backwards from the current folder up to the root
      while (current) {
        // Add the current folder to the front of the array
        path.unshift({ id: current.id, name: current.name });
        
        // Find its parent for the next loop iteration
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
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const folderId = resolvedParams.id;
  
  // Get the full traced path
  const folderPath = await getFolderPath(folderId);

  return (
    <div className="w-full space-y-6">
      {/* Full Dynamic Breadcrumb Path */}
      <div className="flex items-center space-x-2 text-xs text-[#B7C1D8] px-2">
        <Link href="/files" className="hover:text-[#8B5CF6] transition-colors">
          Root
        </Link>
        
        {folderPath.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <span>/</span>
            {index === folderPath.length - 1 ? (
              // The current active folder (Last item) - highlight it
              <span className="text-white font-semibold tracking-wide">{folder.name}</span>
            ) : (
              // The parent folders - make them clickable links
              <Link href={`/files/${folder.id}`} className="hover:text-[#8B5CF6] transition-colors">
                {folder.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>

      <FolderExplorer key={folderId} currentFolderId={folderId} />
    </div>
  );
}