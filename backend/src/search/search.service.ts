import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, query: string) {
    const [files, allUserFolders, allUserFiles] = await Promise.all([
      this.prisma.file.findMany({
        where: {
          ownerId: userId,
          deletedAt: null,
          OR: [
            {
              originalName: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          favorites: {
            where: {
              userId,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),

      this.prisma.folder.findMany({
        where: {
          ownerId: userId,
          deletedAt: null,
        },
      }),

      this.prisma.file.findMany({
        where: {
          ownerId: userId,
          deletedAt: null,
        },
        select: {
          folderId: true,
          size: true,
        },
      }),
    ]);

    const formattedFiles = files.map((file) => ({
      ...file,
      isFavorite: Boolean(file.favorites && file.favorites.length > 0),
    }));

    // Build children and file maps for recursive folder stats
    const childrenMap = new Map<string, string[]>();
    for (const folder of allUserFolders) {
      if (folder.parentId) {
        const list = childrenMap.get(folder.parentId) || [];
        list.push(folder.id);
        childrenMap.set(folder.parentId, list);
      }
    }

    const fileSizesByFolder = new Map<string, number[]>();
    for (const file of allUserFiles) {
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

    const matchingFolders = allUserFolders.filter((f) =>
      f.name?.toLowerCase().includes(query.toLowerCase()),
    );

    const formattedFolders = matchingFolders.map((folder) => {
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

    return {
      files: formattedFiles,
      folders: formattedFolders,
    };
  }
}