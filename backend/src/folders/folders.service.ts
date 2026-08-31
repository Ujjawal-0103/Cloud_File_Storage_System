import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    userId: string,
    createFolderDto: CreateFolderDto,
  ) {
    if (createFolderDto.parentId) {
      const parentFolder = await this.prisma.folder.findFirst({
        where: {
          id: createFolderDto.parentId,
          ownerId: userId,
          deletedAt: null,
        },
      });

      if (!parentFolder) {
        throw new NotFoundException(
          'Parent folder not found',
        );
      }
    }

    return this.prisma.folder.create({
      data: {
        name: createFolderDto.name,
        ownerId: userId,
        parentId: createFolderDto.parentId,
      },
    });
  }

  private computeFolderStats(folders: any[], files: any[]) {
    // Map folderId -> array of child folderIds
    const childrenMap = new Map<string, string[]>();
    for (const folder of folders) {
      if (folder.parentId) {
        const list = childrenMap.get(folder.parentId) || [];
        list.push(folder.id);
        childrenMap.set(folder.parentId, list);
      }
    }

    // Map folderId -> array of file sizes
    const fileSizesByFolder = new Map<string, number[]>();
    for (const file of files) {
      if (file.folderId) {
        const list = fileSizesByFolder.get(file.folderId) || [];
        list.push(file.size || 0);
        fileSizesByFolder.set(file.folderId, list);
      }
    }

    // Recursive helper to gather all descendant folder IDs
    const getAllDescendantFolderIds = (folderId: string): string[] => {
      const descendants: string[] = [];
      const directChildren = childrenMap.get(folderId) || [];
      for (const childId of directChildren) {
        descendants.push(childId);
        descendants.push(...getAllDescendantFolderIds(childId));
      }
      return descendants;
    };

    return folders.map((folder) => {
      const directChildren = childrenMap.get(folder.id) || [];
      const directFiles = fileSizesByFolder.get(folder.id) || [];
      const directItemCount = directFiles.length + directChildren.length;

      // Recursive size across this folder and all its descendant subfolders
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
  }

  async findAll(userId: string) {
    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: {
          ownerId: userId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
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

    return this.computeFolderStats(folders, files);
  }

  async findOne(userId: string, folderId: string) {
    const [folders, files] = await Promise.all([
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

    const computed = this.computeFolderStats(folders, files);
    const folder = computed.find((f) => f.id === folderId);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async update(
    userId: string,
    folderId: string,
    updateFolderDto: UpdateFolderDto,
  ) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (updateFolderDto.parentId) {
      // A folder cannot be its own parent
      if (updateFolderDto.parentId === folderId) {
        throw new BadRequestException(
          'A folder cannot be its own parent',
        );
      }

      // Parent must belong to the same user
      const parentFolder = await this.prisma.folder.findFirst({
        where: {
          id: updateFolderDto.parentId,
          ownerId: userId,
          deletedAt: null,
        },
      });

      if (!parentFolder) {
        throw new NotFoundException(
          'Parent folder not found',
        );
      }

      // Check whether the selected parent is a descendant
      let currentParentId = parentFolder.parentId;

      while (currentParentId) {
        if (currentParentId === folderId) {
          throw new BadRequestException(
            'Cannot move a folder inside one of its descendants',
          );
        }

        const currentParent = await this.prisma.folder.findUnique({
          where: {
            id: currentParentId,
          },
          select: {
            parentId: true,
          },
        });

        if (!currentParent) {
          break;
        }

        currentParentId = currentParent.parentId;
      }
    }

    return this.prisma.folder.update({
      where: {
        id: folderId,
      },
      data: updateFolderDto,
    });
  }

  // Recursive helper to gather all descendant folder IDs
  async getDescendantFolderIds(userId: string, rootFolderId: string): Promise<string[]> {
    const allUserFolders = await this.prisma.folder.findMany({
      where: { ownerId: userId },
      select: { id: true, parentId: true },
    });

    const childrenMap = new Map<string, string[]>();
    for (const f of allUserFolders) {
      if (f.parentId) {
        const list = childrenMap.get(f.parentId) || [];
        list.push(f.id);
        childrenMap.set(f.parentId, list);
      }
    }

    const descendants: string[] = [];
    const queue = [...(childrenMap.get(rootFolderId) || [])];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      descendants.push(currentId);
      const childIds = childrenMap.get(currentId) || [];
      queue.push(...childIds);
    }

    return descendants;
  }

  async remove(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found or already in trash');
    }

    const descendantFolderIds = await this.getDescendantFolderIds(userId, folderId);
    const allTargetFolderIds = [folderId, ...descendantFolderIds];
    const now = new Date();

    // Soft-delete all files in this folder and all nested subfolders
    await this.prisma.file.updateMany({
      where: {
        folderId: { in: allTargetFolderIds },
        ownerId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    });

    // Soft-delete the folder and all nested subfolders
    await this.prisma.folder.updateMany({
      where: {
        id: { in: allTargetFolderIds },
        ownerId: userId,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    });

    return {
      message: 'Folder and all its subfolders and files moved to trash',
      id: folderId,
    };
  }

  async restore(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId,
        deletedAt: { not: null },
      },
    });

    if (!folder) {
      throw new NotFoundException('Trashed folder not found');
    }

    // Check if the parent folder is still in trash (or missing)
    let resetParentId = false;
    if (folder.parentId) {
      const parent = await this.prisma.folder.findFirst({
        where: {
          id: folder.parentId,
          ownerId: userId,
          deletedAt: null,
        },
      });
      // If parent does not exist or is still trashed, detach to root
      if (!parent) {
        resetParentId = true;
      }
    }

    const descendantFolderIds = await this.getDescendantFolderIds(userId, folderId);
    const allTargetFolderIds = [folderId, ...descendantFolderIds];

    // Restore all files in this folder and all nested subfolders
    await this.prisma.file.updateMany({
      where: {
        folderId: { in: allTargetFolderIds },
        ownerId: userId,
      },
      data: {
        deletedAt: null,
      },
    });

    // Restore the folder and all nested subfolders
    await this.prisma.folder.updateMany({
      where: {
        id: { in: allTargetFolderIds },
        ownerId: userId,
      },
      data: {
        deletedAt: null,
      },
    });

    if (resetParentId) {
      await this.prisma.folder.update({
        where: { id: folderId },
        data: { parentId: null },
      });
    }

    return {
      message: 'Folder and its contents restored successfully',
      id: folderId,
    };
  }

  async permanentlyDelete(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    const descendantFolderIds = await this.getDescendantFolderIds(userId, folderId);
    const allTargetFolderIds = [folderId, ...descendantFolderIds];

    // Find all files in folder tree to destroy from Cloudinary
    const files = await this.prisma.file.findMany({
      where: {
        folderId: { in: allTargetFolderIds },
        ownerId: userId,
      },
    });

    for (const file of files) {
      if (file.publicId) {
        try {
          await this.cloudinaryService.deleteFile(
            file.publicId,
            file.mimeType,
          );
        } catch (e) {
          console.error('Error deleting file from Cloudinary:', e);
        }
      }
    }

    const fileIds = files.map((f) => f.id);

    // Delete relation records if any
    if (fileIds.length > 0) {
      await this.prisma.favorite.deleteMany({
        where: { fileId: { in: fileIds } },
      });
      await this.prisma.sharedItem.deleteMany({
        where: { fileId: { in: fileIds } },
      });
      await this.prisma.activityLog.deleteMany({
        where: { fileId: { in: fileIds } },
      });
      await this.prisma.file.deleteMany({
        where: { id: { in: fileIds } },
      });
    }

    await this.prisma.activityLog.deleteMany({
      where: { folderId: { in: allTargetFolderIds } },
    });

    // Delete all descendant folders bottom-up, then the root folder
    for (let i = descendantFolderIds.length - 1; i >= 0; i--) {
      await this.prisma.folder.delete({
        where: { id: descendantFolderIds[i] },
      });
    }

    return this.prisma.folder.delete({
      where: {
        id: folderId,
      },
    });
  }

  async getTree(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const folderMap = new Map<string, any>();

    for (const folder of folders) {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
      });
    }

    const tree: any[] = [];

    for (const folder of folders) {
      const currentFolder = folderMap.get(folder.id);

      if (folder.parentId) {
        const parentFolder = folderMap.get(folder.parentId);

        if (parentFolder) {
          parentFolder.children.push(currentFolder);
        }
      } else {
        tree.push(currentFolder);
      }
    }

    return tree;
  }

  async toggleFavorite(userId: string, folderId: string, isFavorite?: boolean) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    const nextState = isFavorite !== undefined ? isFavorite : !folder.isFavorite;

    return this.prisma.folder.update({
      where: {
        id: folderId,
      },
      data: {
        isFavorite: nextState,
      },
    });
  }
}

