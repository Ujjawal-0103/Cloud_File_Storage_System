import { Injectable, Optional } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_QUOTA_BYTES } from '../files/files.service';
import { CacheService } from '../common/cache/cache.service';

export interface CategoryStat {
  category: string;
  count: number;
  bytes: number;
  formattedBytes: string;
  percentage: number;
}

export interface MostDownloadedFile {
  fileId: string;
  name: string;
  downloadCount: number;
  sizeBytes: number;
  formattedSize: string;
  mimeType: string;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function categorizeMime(mimeType: string, filename = ''): string {
  const mime = (mimeType || '').toLowerCase();
  const name = (filename || '').toLowerCase();

  if (mime.startsWith('image/')) return 'Images';
  if (
    mime.startsWith('video/') ||
    name.endsWith('.mp4') ||
    name.endsWith('.mkv') ||
    name.endsWith('.mov') ||
    name.endsWith('.webm')
  ) {
    return 'Videos';
  }
  if (
    mime.startsWith('audio/') ||
    name.endsWith('.mp3') ||
    name.endsWith('.wav') ||
    name.endsWith('.ogg')
  ) {
    return 'Audio';
  }
  if (
    mime.includes('javascript') ||
    mime.includes('typescript') ||
    mime.includes('json') ||
    mime.includes('html') ||
    mime.includes('css') ||
    mime === 'text/xml' ||
    mime === 'application/xml' ||
    mime.includes('python') ||
    mime.includes('markdown') ||
    name.endsWith('.js') ||
    name.endsWith('.ts') ||
    name.endsWith('.jsx') ||
    name.endsWith('.tsx') ||
    name.endsWith('.json') ||
    name.endsWith('.html') ||
    name.endsWith('.css') ||
    name.endsWith('.py') ||
    name.endsWith('.java') ||
    name.endsWith('.cpp') ||
    name.endsWith('.c') ||
    name.endsWith('.go') ||
    name.endsWith('.rs') ||
    name.endsWith('.md')
  ) {
    return 'Code';
  }
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('officedocument') ||
    mime.includes('msword') ||
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    mime.includes('powerpoint') ||
    mime.includes('presentation') ||
    mime === 'text/plain' ||
    name.endsWith('.pdf') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx')
  ) {
    return 'Documents';
  }
  return 'Other';
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cacheService?: CacheService,
  ) {}

  async getDashboardData(userId: string) {
    const cacheKey = `dashboard:${userId}`;
    if (this.cacheService) {
      const cached = this.cacheService.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Run independent aggregation queries concurrently using Promise.all
    const [
      user,
      storageAggregate,
      activeFileCount,
      trashedFileCount,
      activeFolderCount,
      trashedFolderCount,
      rootFolderCount,
      totalSharedItemsCount,
      sentSharesCount,
      receivedSharesCount,
      favoritesCount,
      totalDownloadsCount,
      downloadsThisWeekCount,
      uploadsThisWeekCount,
      sharesThisWeekCount,
      deletesThisWeekCount,
      allActiveFiles,
      topDownloadGroups,
      recentActivityLogs,
      recentFilesList,
    ] = await Promise.all([
      // 1. User Profile
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
        },
      }),

      // 2. Storage Aggregation
      this.prisma.file.aggregate({
        where: { ownerId: userId, deletedAt: null },
        _sum: { size: true },
      }),

      // 3. Active Files
      this.prisma.file.count({
        where: { ownerId: userId, deletedAt: null },
      }),

      // 4. Trashed Files
      this.prisma.file.count({
        where: { ownerId: userId, deletedAt: { not: null } },
      }),

      // 5. Active Folders
      this.prisma.folder.count({
        where: { ownerId: userId, deletedAt: null },
      }),

      // 6. Trashed Folders
      this.prisma.folder.count({
        where: { ownerId: userId, deletedAt: { not: null } },
      }),

      // 7. Root Folders
      this.prisma.folder.count({
        where: { ownerId: userId, deletedAt: null, parentId: null },
      }),

      // 8. Total Unique Shared Items
      this.prisma.sharedItem.count({
        where: {
          OR: [{ sharedById: userId }, { sharedWithId: userId }],
        },
      }),

      // 9. Sent Shares
      this.prisma.sharedItem.count({
        where: { sharedById: userId },
      }),

      // 10. Received Shares
      this.prisma.sharedItem.count({
        where: { sharedWithId: userId },
      }),

      // 10. Favorites
      this.prisma.favorite.count({
        where: { userId },
      }),

      // 11. Total Downloads (User's download activity)
      this.prisma.activityLog.count({
        where: { userId, action: ActivityType.DOWNLOAD },
      }),

      // 12. Downloads This Week
      this.prisma.activityLog.count({
        where: {
          userId,
          action: ActivityType.DOWNLOAD,
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // 13. Uploads This Week
      this.prisma.activityLog.count({
        where: {
          userId,
          action: ActivityType.UPLOAD,
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // 14. Shares This Week
      this.prisma.activityLog.count({
        where: {
          userId,
          action: ActivityType.SHARE,
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // 15. Deletes This Week
      this.prisma.activityLog.count({
        where: {
          userId,
          action: ActivityType.DELETE,
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // 16. All active files for category breakdown
      this.prisma.file.findMany({
        where: { ownerId: userId, deletedAt: null },
        select: { id: true, name: true, mimeType: true, size: true },
      }),

      // 17. Most downloaded files by grouping
      this.prisma.activityLog.groupBy({
        by: ['fileId'],
        where: {
          userId,
          action: ActivityType.DOWNLOAD,
          fileId: { not: null },
        },
        _count: {
          fileId: true,
        },
        orderBy: {
          _count: {
            fileId: 'desc',
          },
        },
        take: 5,
      }),

      // 18. Recent Activity Logs (top 10)
      this.prisma.activityLog.findMany({
        where: { userId },
        include: {
          file: {
            select: {
              id: true,
              name: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      // 19. Recent Files
      this.prisma.file.findMany({
        where: { ownerId: userId, deletedAt: null },
        include: {
          favorites: {
            where: { userId },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
    ]);

    // Compute Storage Stats
    const usedBytes = storageAggregate._sum.size || 0;
    const quotaBytes = STORAGE_QUOTA_BYTES;
    const percentageUsed = parseFloat(((usedBytes / quotaBytes) * 100).toFixed(2));

    // Compute Category Breakdown
    const catMap: Record<string, { count: number; bytes: number }> = {
      Images: { count: 0, bytes: 0 },
      Documents: { count: 0, bytes: 0 },
      Videos: { count: 0, bytes: 0 },
      Audio: { count: 0, bytes: 0 },
      Code: { count: 0, bytes: 0 },
      Other: { count: 0, bytes: 0 },
    };

    for (const f of allActiveFiles) {
      const category = categorizeMime(f.mimeType, f.name);
      catMap[category].count += 1;
      catMap[category].bytes += f.size || 0;
    }

    const categories: CategoryStat[] = Object.keys(catMap).map((catName) => {
      const item = catMap[catName];
      const catPercentage = usedBytes > 0 ? parseFloat(((item.bytes / usedBytes) * 100).toFixed(1)) : 0;
      return {
        category: catName,
        count: item.count,
        bytes: item.bytes,
        formattedBytes: formatBytes(item.bytes),
        percentage: catPercentage,
      };
    });

    // Populate Most Downloaded Files
    let mostDownloadedFiles: MostDownloadedFile[] = [];
    if (topDownloadGroups.length > 0) {
      const validFileIds = topDownloadGroups
        .map((g) => g.fileId)
        .filter((id): id is string => id !== null);

      if (validFileIds.length > 0) {
        const fileDetails = await this.prisma.file.findMany({
          where: { id: { in: validFileIds } },
          select: { id: true, name: true, size: true, mimeType: true },
        });

        const detailMap = new Map((fileDetails || []).map((f) => [f.id, f]));

        mostDownloadedFiles = topDownloadGroups
          .filter((g) => g.fileId && detailMap.has(g.fileId))
          .map((g) => {
            const f = detailMap.get(g.fileId!)!;
            return {
              fileId: f.id,
              name: f.name,
              downloadCount: g._count.fileId,
              sizeBytes: f.size,
              formattedSize: formatBytes(f.size),
              mimeType: f.mimeType,
            };
          });
      }
    }

    // Format formatted recent files
    const formattedRecentFiles = recentFilesList.map((file) => ({
      id: file.id,
      name: file.originalName || file.name,
      url: file.url,
      sizeBytes: file.size,
      formattedSize: formatBytes(file.size),
      mimeType: file.mimeType,
      category: categorizeMime(file.mimeType, file.name),
      isFavorite: Boolean(file.favorites && file.favorites.length > 0),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));

    // Format Recent Activity
    const formattedRecentActivity = recentActivityLogs.map((log) => {
      let description = '';
      const targetName = log.file?.originalName || log.file?.name || log.folder?.name || 'an item';

      switch (log.action) {
        case ActivityType.UPLOAD:
          description = `Uploaded file "${targetName}"`;
          break;
        case ActivityType.DOWNLOAD:
          description = `Downloaded file "${targetName}"`;
          break;
        case ActivityType.DELETE:
          description = `Deleted "${targetName}"`;
          break;
        case ActivityType.SHARE:
          description = `Shared "${targetName}"`;
          break;
        case ActivityType.CREATE_FOLDER:
          description = `Created folder "${targetName}"`;
          break;
        case ActivityType.RENAME_FOLDER:
          description = `Renamed folder "${targetName}"`;
          break;
        case ActivityType.RENAME_FILE:
          description = `Renamed file "${targetName}"`;
          break;
        case ActivityType.MOVE_FILE:
          description = `Moved file "${targetName}"`;
          break;
        case ActivityType.COPY_FILE:
          description = `Copied file "${targetName}"`;
          break;
        case ActivityType.LOGIN:
          description = 'User logged in';
          break;
        case ActivityType.REGISTER:
          description = 'Account registered';
          break;
        default:
          description = `Action ${log.action} performed`;
      }

      return {
        id: log.id,
        action: log.action,
        description,
        createdAt: log.createdAt,
        file: log.file
          ? {
              id: log.file.id,
              name: log.file.originalName || log.file.name,
              mimeType: log.file.mimeType,
              size: log.file.size,
              formattedSize: formatBytes(log.file.size),
            }
          : null,
        folder: log.folder
          ? {
              id: log.folder.id,
              name: log.folder.name,
            }
          : null,
      };
    });

    const result = {
      storage: {
        usedBytes,
        quotaBytes,
        usedFormatted: formatBytes(usedBytes),
        quotaFormatted: formatBytes(quotaBytes),
        percentageUsed,
        fileCount: activeFileCount,
      },
      files: {
        total: activeFileCount,
        trashedCount: trashedFileCount,
        favoritesCount,
        byCategory: categories,
      },
      folders: {
        total: activeFolderCount,
        trashedCount: trashedFolderCount,
        rootCount: rootFolderCount,
      },
      shares: {
        total: totalSharedItemsCount,
        sentCount: sentSharesCount,
        receivedCount: receivedSharesCount,
      },
      downloads: {
        totalDownloads: totalDownloadsCount,
        downloadsThisWeek: downloadsThisWeekCount,
        mostDownloadedFiles,
      },
      activitySummary: {
        uploadsThisWeek: uploadsThisWeekCount,
        downloadsThisWeek: downloadsThisWeekCount,
        sharesThisWeek: totalSharedItemsCount,
        deletesThisWeek: deletesThisWeekCount,
      },
      recentFiles: formattedRecentFiles,
      recentActivity: formattedRecentActivity,
      user: user || {
        id: userId,
        name: 'User',
        email: '',
        avatar: null,
        createdAt: new Date(),
      },
    };

    if (this.cacheService) {
      this.cacheService.set(cacheKey, result, 15000);
    }

    return result;
  }

  async getRecentActivity(userId: string, page = 1, limit = 10) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      this.prisma.activityLog.count({
        where: { userId },
      }),
      this.prisma.activityLog.findMany({
        where: { userId },
        include: {
          file: {
            select: {
              id: true,
              name: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
    ]);

    const activities = logs.map((log) => {
      let description = '';
      const targetName = log.file?.originalName || log.file?.name || log.folder?.name || 'an item';

      switch (log.action) {
        case ActivityType.UPLOAD:
          description = `Uploaded file "${targetName}"`;
          break;
        case ActivityType.DOWNLOAD:
          description = `Downloaded file "${targetName}"`;
          break;
        case ActivityType.DELETE:
          description = `Deleted "${targetName}"`;
          break;
        case ActivityType.SHARE:
          description = `Shared "${targetName}"`;
          break;
        case ActivityType.CREATE_FOLDER:
          description = `Created folder "${targetName}"`;
          break;
        case ActivityType.RENAME_FOLDER:
          description = `Renamed folder "${targetName}"`;
          break;
        case ActivityType.RENAME_FILE:
          description = `Renamed file "${targetName}"`;
          break;
        case ActivityType.MOVE_FILE:
          description = `Moved file "${targetName}"`;
          break;
        case ActivityType.COPY_FILE:
          description = `Copied file "${targetName}"`;
          break;
        case ActivityType.LOGIN:
          description = 'User logged in';
          break;
        case ActivityType.REGISTER:
          description = 'Account registered';
          break;
        default:
          description = `Action ${log.action} performed`;
      }

      return {
        id: log.id,
        action: log.action,
        description,
        createdAt: log.createdAt,
        file: log.file
          ? {
              id: log.file.id,
              name: log.file.originalName || log.file.name,
              mimeType: log.file.mimeType,
              size: log.file.size,
              formattedSize: formatBytes(log.file.size),
            }
          : null,
        folder: log.folder
          ? {
              id: log.folder.id,
              name: log.folder.name,
            }
          : null,
      };
    });

    return {
      activities,
      items: activities,
      data: activities,
      total,
      page: pageNum,
      limit: limitNum,
      pageSize: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
