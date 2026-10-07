import { Test, TestingModule } from '@nestjs/testing';
import {
  DashboardService,
  formatBytes,
  categorizeMime,
} from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      file: {
        aggregate: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      folder: {
        count: jest.fn(),
      },
      sharedItem: {
        count: jest.fn(),
      },
      favorite: {
        count: jest.fn(),
      },
      activityLog: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('formatBytes helper', () => {
    it('should format bytes accurately', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('categorizeMime helper', () => {
    it('should identify images', () => {
      expect(categorizeMime('image/png', 'photo.png')).toBe('Images');
      expect(categorizeMime('image/jpeg', 'pic.jpg')).toBe('Images');
    });

    it('should identify documents', () => {
      expect(categorizeMime('application/pdf', 'doc.pdf')).toBe('Documents');
      expect(categorizeMime('text/plain', 'note.txt')).toBe('Documents');
      expect(
        categorizeMime(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'resume.docx',
        ),
      ).toBe('Documents');
    });

    it('should identify code', () => {
      expect(categorizeMime('application/json', 'config.json')).toBe('Code');
      expect(categorizeMime('text/javascript', 'index.js')).toBe('Code');
      expect(categorizeMime('text/plain', 'main.ts')).toBe('Code');
    });

    it('should identify videos', () => {
      expect(categorizeMime('video/mp4', 'clip.mp4')).toBe('Videos');
    });

    it('should identify audio', () => {
      expect(categorizeMime('audio/mpeg', 'song.mp3')).toBe('Audio');
    });

    it('should fallback to other', () => {
      expect(categorizeMime('application/octet-stream', 'unknown.bin')).toBe('Other');
    });
  });

  describe('getDashboardData', () => {
    it('should return aggregated metrics scoped to the user', async () => {
      const userId = 'user-test-123';

      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        name: 'Alice',
        email: 'alice@example.com',
        avatar: null,
        createdAt: new Date(),
      });

      prisma.file.aggregate.mockResolvedValue({
        _sum: { size: 5242880 }, // 5 MB
      });

      // activeFileCount, trashedFileCount
      prisma.file.count
        .mockResolvedValueOnce(5) // active files
        .mockResolvedValueOnce(2); // trashed files

      // activeFolderCount, trashedFolderCount, rootFolderCount
      prisma.folder.count
        .mockResolvedValueOnce(3) // active folders
        .mockResolvedValueOnce(1) // trashed folders
        .mockResolvedValueOnce(2); // root folders

      // totalShared, sentShares, receivedShares
      prisma.sharedItem.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(4) // sent
        .mockResolvedValueOnce(1); // received

      // favorites
      prisma.favorite.count.mockResolvedValue(3);

      // activity counts: totalDownloads, downloadsThisWeek, uploadsThisWeek, sharesThisWeek, deletesThisWeek
      prisma.activityLog.count
        .mockResolvedValueOnce(12) // total downloads
        .mockResolvedValueOnce(5)  // downloads this week
        .mockResolvedValueOnce(4)  // uploads this week
        .mockResolvedValueOnce(2)  // shares this week
        .mockResolvedValueOnce(1); // deletes this week

      // allActiveFiles for category breakdown
      prisma.file.findMany
        .mockResolvedValueOnce([
          { id: 'f1', name: 'photo.jpg', mimeType: 'image/jpeg', size: 2097152 },
          { id: 'f2', name: 'doc.pdf', mimeType: 'application/pdf', size: 3145728 },
        ])
        // recent files
        .mockResolvedValueOnce([
          {
            id: 'f1',
            name: 'photo.jpg',
            originalName: 'photo.jpg',
            url: 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg',
            size: 2097152,
            mimeType: 'image/jpeg',
            createdAt: new Date(),
            updatedAt: new Date(),
            favorites: [{ userId }],
          },
        ])
        // top downloaded file details
        .mockResolvedValueOnce([
          { id: 'f1', name: 'photo.jpg', size: 2097152, mimeType: 'image/jpeg' },
        ]);

      // top download groups
      prisma.activityLog.groupBy.mockResolvedValue([
        { fileId: 'f1', _count: { fileId: 8 } },
      ]);

      // recent activity logs
      prisma.activityLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: ActivityType.UPLOAD,
          createdAt: new Date(),
          file: {
            id: 'f1',
            name: 'photo.jpg',
            originalName: 'photo.jpg',
            mimeType: 'image/jpeg',
            size: 2097152,
          },
          folder: null,
        },
      ]);

      const result = await service.getDashboardData(userId);

      expect(prisma.file.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: userId }),
        }),
      );

      expect(result.storage.usedBytes).toBe(5242880);
      expect(result.storage.fileCount).toBe(5);
      expect(result.files.total).toBe(5);
      expect(result.files.trashedCount).toBe(2);
      expect(result.folders.total).toBe(3);
      expect(result.folders.trashedCount).toBe(1);
      expect(result.shares.total).toBe(5);
      expect(result.activitySummary.sharesThisWeek).toBe(5);
      expect(result.downloads.totalDownloads).toBe(12);
      expect(result.downloads.downloadsThisWeek).toBe(5);
      expect(result.recentFiles.length).toBe(1);
      expect(result.recentFiles[0].isFavorite).toBe(true);
      expect(result.recentActivity.length).toBe(1);
      expect(result.recentActivity[0].description).toContain('Uploaded file');
      expect(result.user.name).toBe('Alice');
    });
  });

  describe('getRecentActivity', () => {
    it('should paginate and return formatted activity logs', async () => {
      const userId = 'user-test-123';

      prisma.activityLog.count.mockResolvedValue(1);
      prisma.activityLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: ActivityType.CREATE_FOLDER,
          createdAt: new Date(),
          file: null,
          folder: {
            id: 'fold-1',
            name: 'Projects',
          },
        },
      ]);

      const result = await service.getRecentActivity(userId, 1, 10);

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.activities[0].description).toBe('Created folder "Projects"');
      expect(result.activities[0].action).toBe(ActivityType.CREATE_FOLDER);
    });
  });
});
