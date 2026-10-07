import { Test, TestingModule } from '@nestjs/testing';
import { SharingService } from './sharing.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SharingService', () => {
  let service: SharingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      file: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      folder: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      sharedItem: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      activityLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('shareFile', () => {
    it('should reject sharing with oneself', async () => {
      prisma.file.findFirst.mockResolvedValue({ id: 'f-1', ownerId: 'user-1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'owner@example.com' });

      await expect(
        service.shareFile('f-1', 'user-1', { email: 'owner@example.com', permission: 'VIEW' })
      ).rejects.toThrow(ConflictException);
    });

    it('should share file successfully', async () => {
      prisma.file.findFirst.mockResolvedValue({ id: 'f-1', ownerId: 'user-1', name: 'report.pdf' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'recipient@example.com' });
      prisma.sharedItem.findFirst.mockResolvedValue(null);
      prisma.sharedItem.create.mockResolvedValue({
        id: 'share-1',
        fileId: 'f-1',
        sharedById: 'user-1',
        sharedWithId: 'user-2',
        permission: 'VIEW',
      });
      prisma.activityLog.create.mockResolvedValue({});

      const res = await service.shareFile('f-1', 'user-1', {
        email: 'recipient@example.com',
        permission: 'VIEW',
      });

      expect(res).toHaveProperty('message');
      expect(res.share).toHaveProperty('permission', 'VIEW');
    });
  });

  describe('createPublicShare & getPublicShare', () => {
    it('should create public link with unique token', async () => {
      prisma.file.findFirst.mockResolvedValue({ id: 'f-1', ownerId: 'user-1' });
      prisma.sharedItem.findFirst.mockResolvedValue(null);
      prisma.sharedItem.create.mockResolvedValue({
        id: 'pub-share-1',
        publicToken: 'abc123token',
        isPublic: true,
      });

      const res = await service.createPublicShare('user-1', { fileId: 'f-1' });
      expect(res).toHaveProperty('publicToken');
      expect(prisma.sharedItem.create).toHaveBeenCalled();
    });

    it('should reject access to expired public link', async () => {
      prisma.sharedItem.findUnique.mockResolvedValue({
        id: 'pub-share-1',
        isPublic: true,
        expiresAt: new Date(Date.now() - 3600000), // expired 1 hour ago
      });

      await expect(service.getPublicShare('expired-token')).rejects.toThrow(NotFoundException);
    });
  });
});
