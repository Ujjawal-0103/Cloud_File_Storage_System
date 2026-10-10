import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
  Logger,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CacheService } from '../common/cache/cache.service';

export const STORAGE_QUOTA_BYTES = 15 * 1024 * 1024 * 1024; // 15 GB

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    @Optional() private readonly cacheService?: CacheService,
  ) {}

  async findAll(
    userId: string,
    folderId?: string,
    mimeType?: string,
    sortBy: 'name' | 'size' | 'createdAt' | 'updatedAt' = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    page = 1,
    limit = 20,
  ) {
    const where: any = {
      ownerId: userId,
      deletedAt: null,
    };

    if (folderId !== 'all') {
      where.folderId = folderId || null;
    }

    if (mimeType) {
      where.mimeType = {
        contains: mimeType,
      };
    }

    const skip = (page - 1) * limit;

    const [total, files] = await Promise.all([
      this.prisma.file.count({ where }),
      this.prisma.file.findMany({
        where,
        include: {
          favorites: {
            where: {
              userId,
            },
          },
        },
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: limit,
      }),
    ]);

    const formattedFiles = files.map((file) => ({
      ...file,
      isFavorite: Boolean(file.favorites && file.favorites.length > 0),
    }));

    return {
      total,
      page,
      limit,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      files: formattedFiles,
      items: formattedFiles,
      data: formattedFiles,
    };
  }

  async getRecentFiles(userId: string, limit = 10) {
    const files = await this.prisma.file.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      include: {
        favorites: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return files.map((file) => ({
      ...file,
      isFavorite: Boolean(file.favorites && file.favorites.length > 0),
    }));
  }

  async getStorageUsage(userId: string) {
    const cacheKey = `storage:${userId}`;
    if (this.cacheService) {
      const cached = this.cacheService.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const [result, fileCount] = await Promise.all([
      this.prisma.file.aggregate({
        where: {
          ownerId: userId,
          deletedAt: null,
        },
        _sum: {
          size: true,
        },
      }),
      this.prisma.file.count({
        where: {
          ownerId: userId,
          deletedAt: null,
        },
      }),
    ]);

    const data = {
      usedBytes: result._sum.size || 0,
      quotaBytes: STORAGE_QUOTA_BYTES,
      fileCount,
    };

    if (this.cacheService) {
      this.cacheService.set(cacheKey, data, 30000);
    }

    return data;
  }

  async downloadFile(id: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { ownerId: userId },
          { sharedItems: { some: { sharedWithId: userId } } },
          { sharedItems: { some: { isPublic: true } } },
        ],
      },
    });

    if (!file) {
      throw new NotFoundException('File not found or unauthorized');
    }

    if (this.prisma.activityLog?.create) {
      try {
        await this.prisma.activityLog.create({
          data: {
            action: ActivityType.DOWNLOAD,
            userId,
            fileId: file.id,
            folderId: file.folderId || null,
          },
        });
      } catch (e) {
        console.error('Error logging download activity:', e);
      }
    }

    let downloadUrl = file.url;
    if (downloadUrl && downloadUrl.includes('/upload/')) {
      downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
    }

    return {
      downloadUrl,
      file,
    };
  }

  async uploadFile(
    file: any,
    userId: string,
    folderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file received. Make sure the form field is named "file".',
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file buffer is empty or corrupted');
    }

    const sanitizedFolderId =
      folderId && folderId !== 'root' && folderId !== 'null' && folderId !== 'undefined'
        ? folderId
        : null;

    if (sanitizedFolderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: sanitizedFolderId, ownerId: userId, deletedAt: null },
      });
      if (!folder) {
        throw new NotFoundException('Destination folder not found or unauthorized');
      }
    }

    // 1. Quota Enforcement BEFORE Cloudinary upload
    const currentUsage = await this.prisma.file.aggregate({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      _sum: {
        size: true,
      },
    });

    const usedBytes = currentUsage._sum.size || 0;
    const incomingSize = Number(file.size) || (file.buffer ? file.buffer.length : 0);

    if (usedBytes + incomingSize > STORAGE_QUOTA_BYTES) {
      throw new BadRequestException(
        `Storage quota exceeded. Your storage limit is 15 GB. Current usage: ${(usedBytes / (1024 * 1024)).toFixed(1)} MB.`,
      );
    }

    this.logger.log(
      `[Upload] Starting file upload for user ${userId}: "${file.originalname}" (${incomingSize} bytes, ${file.mimetype})`,
    );

    // 2. Upload to Cloudinary
    const result: any = await this.cloudinaryService.uploadFile(file);

    // 3. Save to database with automatic rollback if DB persistence fails
    let savedFile: any;
    try {
      savedFile = await this.prisma.file.create({
        data: {
          name: file.originalname || result.public_id,
          originalName: file.originalname,
          url: result.secure_url || result.url,
          publicId: result.public_id,
          size: incomingSize || Number(result.bytes) || 0,
          mimeType: file.mimetype || 'application/octet-stream',
          ownerId: userId,
          folderId: sanitizedFolderId,
        },
      });
    } catch (dbError) {
      this.logger.error(
        `[Upload] Database persistence failed for file "${file.originalname}". Cleaning up Cloudinary asset ${result.public_id}`,
        dbError,
      );
      try {
        await this.cloudinaryService.deleteFile(result.public_id, file.mimetype);
      } catch (cleanupErr) {
        this.logger.warn(
          `[Upload] Failed to clean up Cloudinary asset ${result.public_id}:`,
          cleanupErr,
        );
      }
      throw dbError;
    }

    // 4. Log upload activity safely
    try {
      await this.prisma.activityLog.create({
        data: {
          action: ActivityType.UPLOAD,
          userId,
          fileId: savedFile.id,
          folderId: sanitizedFolderId,
        },
      });
    } catch (activityErr) {
      this.logger.warn(
        `[Upload] Failed to record upload activity log for file ${savedFile.id}:`,
        activityErr,
      );
    }

    this.invalidateCache(userId);

    this.logger.log(
      `[Upload] File upload successfully completed: id=${savedFile.id}, name="${savedFile.name}"`,
    );

    return {
      message: 'File uploaded successfully',
      file: savedFile,
    };
  }

  async renameFile(id: string, userId: string, newName: string) {
    const trimmed = newName?.trim();
    if (!trimmed) {
      throw new BadRequestException('File name cannot be empty');
    }

    const file = await this.prisma.file.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException('File not found or unauthorized');
    }

    const updated = await this.prisma.file.update({
      where: { id },
      data: { name: trimmed, originalName: trimmed },
    });

    await this.prisma.activityLog.create({
      data: {
        action: ActivityType.RENAME_FILE,
        userId,
        fileId: id,
      },
    });

    this.invalidateCache(userId);

    return {
      message: 'File renamed successfully',
      file: updated,
    };
  }

  async moveFile(id: string, userId: string, folderId: string | null) {
    const file = await this.prisma.file.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException('File not found or unauthorized');
    }

    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: folderId, ownerId: userId, deletedAt: null },
      });

      if (!folder) {
        throw new NotFoundException('Destination folder not found or unauthorized');
      }
    }

    const updated = await this.prisma.file.update({
      where: { id },
      data: { folderId: folderId || null },
    });

    await this.prisma.activityLog.create({
      data: {
        action: ActivityType.MOVE_FILE,
        userId,
        fileId: id,
        folderId: folderId || null,
      },
    });

    this.invalidateCache(userId);

    return {
      message: 'File moved successfully',
      file: updated,
    };
  }

  async copyFile(id: string, userId: string, targetFolderId?: string | null) {
    const file = await this.prisma.file.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException('Source file not found or unauthorized');
    }

    // Quota check for copy
    const currentUsage = await this.prisma.file.aggregate({
      where: { ownerId: userId, deletedAt: null },
      _sum: { size: true },
    });
    const usedBytes = currentUsage._sum.size || 0;

    if (usedBytes + file.size > STORAGE_QUOTA_BYTES) {
      throw new BadRequestException('Storage quota exceeded. Cannot copy file.');
    }

    const destFolderId = targetFolderId !== undefined ? targetFolderId : file.folderId;
    if (destFolderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: destFolderId, ownerId: userId, deletedAt: null },
      });
      if (!folder) {
        throw new NotFoundException('Destination folder not found');
      }
    }

    const copyName = file.name.startsWith('Copy of ')
      ? `Copy of ${file.name}`
      : `Copy of ${file.name}`;

    const copied = await this.prisma.file.create({
      data: {
        name: copyName,
        originalName: copyName,
        url: file.url,
        publicId: file.publicId,
        size: file.size,
        mimeType: file.mimeType,
        ownerId: userId,
        folderId: destFolderId || null,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        action: ActivityType.COPY_FILE,
        userId,
        fileId: copied.id,
        folderId: destFolderId || null,
      },
    });

    this.invalidateCache(userId);

    return {
      message: 'File copied successfully',
      file: copied,
    };
  }

  async deleteFile(id: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id,
        ownerId: userId,
        deletedAt: null,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found or already in trash');
    }

    const updatedFile = await this.prisma.file.update({
      where: {
        id: file.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.prisma.activityLog.create({
      data: {
        action: ActivityType.DELETE,
        userId,
        fileId: id,
      },
    });

    this.invalidateCache(userId);

    return {
      message: 'File moved to trash',
      file: updatedFile,
    };
  }

  async restoreFile(id: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id,
        ownerId: userId,
        deletedAt: { not: null },
      },
    });

    if (!file) {
      throw new NotFoundException('Trashed file not found or unauthorized');
    }

    const restoredFile = await this.prisma.file.update({
      where: { id: file.id },
      data: { deletedAt: null },
    });

    this.invalidateCache(userId);

    return {
      message: 'File restored successfully',
      file: restoredFile,
    };
  }

  async permanentlyDelete(id: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found or unauthorized');
    }

    // Safety: Only delete Cloudinary asset if no other File record in DB shares the same publicId
    const siblingCount = await this.prisma.file.count({
      where: { publicId: file.publicId, id: { not: file.id } },
    });

    if (file.publicId && siblingCount === 0) {
      try {
        await this.cloudinaryService.deleteFile(file.publicId, file.mimeType);
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }
    }

    await this.prisma.file.delete({
      where: { id: file.id },
    });

    this.invalidateCache(userId);

    return {
      message: 'File permanently deleted',
      id: file.id,
    };
  }

  async toggleFavorite(fileId: string, userId: string, isFavorite?: boolean) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found or unauthorized');
    }

    const existingFav = await this.prisma.favorite.findUnique({
      where: {
        userId_fileId: {
          userId,
          fileId,
        },
      },
    });

    const shouldFavorite = isFavorite !== undefined ? isFavorite : !existingFav;

    if (shouldFavorite) {
      if (!existingFav) {
        await this.prisma.favorite.create({
          data: {
            userId,
            fileId,
          },
        });
      }
    } else {
      if (existingFav) {
        await this.prisma.favorite.delete({
          where: {
            userId_fileId: {
              userId,
              fileId,
            },
          },
        });
      }
    }

    this.invalidateCache(userId);

    return {
      message: shouldFavorite
        ? 'File added to favorites'
        : 'File removed from favorites',
      isFavorite: shouldFavorite,
    };
  }

  private invalidateCache(userId: string) {
    if (this.cacheService) {
      this.cacheService.delUser(userId);
    }
  }
}