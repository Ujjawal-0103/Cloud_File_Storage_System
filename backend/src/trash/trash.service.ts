import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FoldersService } from '../folders/folders.service';

@Injectable()
export class TrashService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly foldersService: FoldersService,
  ) {}

  // Get all top-level trashed files and folders with recursive stats
  async getTrash(userId: string) {
    const [allFolders, allFiles] = await Promise.all([
      this.prisma.folder.findMany({
        where: {
          ownerId: userId,
        },
      }),
      this.prisma.file.findMany({
        where: {
          ownerId: userId,
        },
        select: {
          id: true,
          name: true,
          originalName: true,
          url: true,
          size: true,
          mimeType: true,
          folderId: true,
          deletedAt: true,
        },
      }),
    ]);

    const trashedFolders = allFolders.filter((f) => f.deletedAt !== null);
    const trashedFolderIdSet = new Set(trashedFolders.map((f) => f.id));

    // Top-level trashed folders (parent is null or parent is NOT trashed)
    const topLevelTrashedFolders = trashedFolders.filter(
      (f) => !f.parentId || !trashedFolderIdSet.has(f.parentId)
    );

    // Map parentId -> array of child folderIds
    const childrenMap = new Map<string, string[]>();
    for (const folder of allFolders) {
      if (folder.parentId) {
        const list = childrenMap.get(folder.parentId) || [];
        list.push(folder.id);
        childrenMap.set(folder.parentId, list);
      }
    }

    // Map folderId -> array of file sizes
    const fileSizesByFolder = new Map<string, number[]>();
    for (const file of allFiles) {
      if (file.folderId) {
        const list = fileSizesByFolder.get(file.folderId) || [];
        list.push(file.size || 0);
        fileSizesByFolder.set(file.folderId, list);
      }
    }

    const getAllDescendantFolderIds = (folderId: string): string[] => {
      const descendants: string[] = [];
      const directChildren = childrenMap.get(folderId) || [];
      for (const childId of directChildren) {
        descendants.push(childId);
        descendants.push(...getAllDescendantFolderIds(childId));
      }
      return descendants;
    };

    const formattedFolders = topLevelTrashedFolders.map((folder) => {
      const directChildren = childrenMap.get(folder.id) || [];
      const directFiles = fileSizesByFolder.get(folder.id) || [];
      const directItemCount = directFiles.length + directChildren.length;

      const allFolderIds = [folder.id, ...getAllDescendantFolderIds(folder.id)];
      let totalSizeBytes = 0;
      for (const fId of allFolderIds) {
        const fSizes = fileSizesByFolder.get(fId) || [];
        totalSizeBytes += fSizes.reduce((acc, s) => acc + s, 0);
      }

      let formattedSize = '0 KB';
      if (totalSizeBytes > 0) {
        if (totalSizeBytes >= 1024 * 1024 * 1024) {
          formattedSize = `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        } else if (totalSizeBytes >= 1024 * 1024) {
          formattedSize = `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        } else {
          formattedSize = `${(totalSizeBytes / 1024).toFixed(1)} KB`;
        }
      }

      return {
        ...folder,
        itemCount: directItemCount,
        size: formattedSize,
      };
    });

    // Top-level trashed files (files whose folder is not also trashed)
    const topLevelTrashedFiles = allFiles.filter(
      (file) => file.deletedAt !== null && (!file.folderId || !trashedFolderIdSet.has(file.folderId))
    );

    return {
      files: topLevelTrashedFiles,
      folders: formattedFolders,
    };
  }

  // Restore a file from trash
  async restoreFile(
    fileId: string,
    userId: string,
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!file) {
      throw new NotFoundException(
        'Trashed file not found or unauthorized',
      );
    }

    // If parent folder is trashed, detach file to root
    let resetFolderId = false;
    if (file.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: {
          id: file.folderId,
          ownerId: userId,
          deletedAt: null,
        },
      });
      if (!folder) {
        resetFolderId = true;
      }
    }

    const restoredFile =
      await this.prisma.file.update({
        where: {
          id: file.id,
        },
        data: {
          deletedAt: null,
          ...(resetFolderId ? { folderId: null } : {}),
        },
      });

    return {
      message: 'File restored successfully',
      file: restoredFile,
    };
  }

  // Permanently delete a file
  async permanentlyDeleteFile(
    fileId: string,
    userId: string,
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!file) {
      throw new NotFoundException(
        'Trashed file not found or unauthorized',
      );
    }

    // Delete the actual file from Cloudinary
    if (file.publicId) {
      try {
        await this.cloudinaryService.deleteFile(
          file.publicId,
          file.mimeType,
        );
      } catch (error) {
        console.error(
          'Error deleting file from Cloudinary:',
          error,
        );

        throw new Error(
          'Failed to delete file from cloud storage',
        );
      }
    }

    // Delete relation records
    await this.prisma.favorite.deleteMany({
      where: { fileId: file.id },
    });
    await this.prisma.sharedItem.deleteMany({
      where: { fileId: file.id },
    });
    await this.prisma.activityLog.deleteMany({
      where: { fileId: file.id },
    });

    // Delete the file metadata from PostgreSQL
    await this.prisma.file.delete({
      where: {
        id: file.id,
      },
    });

    return {
      message: 'File permanently deleted',
      id: file.id,
    };
  }

  // Restore a folder from trash (recursive cascade)
  async restoreFolder(folderId: string, userId: string) {
    return this.foldersService.restore(userId, folderId);
  }

  // Permanently delete a folder and all its files (recursive cascade)
  async permanentlyDeleteFolder(folderId: string, userId: string) {
    return this.foldersService.permanentlyDelete(userId, folderId);
  }
}