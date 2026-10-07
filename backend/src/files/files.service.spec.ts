import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: any;
  let cloudinary: any;

  beforeEach(async () => {
    prisma = {
      file: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      folder: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      activityLog: {
        create: jest.fn(),
      },
    };

    cloudinary = {
      uploadFile: jest.fn().mockResolvedValue({ secure_url: 'http://example.com/file.jpg', public_id: 'pid-1' }),
      deleteFile: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile & Quota Enforcement', () => {
    it('should reject file upload if 15GB quota is exceeded', async () => {
      // 15 GB limit = 16106127360 bytes
      prisma.file.aggregate.mockResolvedValue({
        _sum: { size: 16106127360 }, // already full
      });

      const mockFile: any = {
        originalname: 'big.mp4',
        mimetype: 'video/mp4',
        size: 1024,
        buffer: Buffer.from('test'),
      };

      await expect(service.uploadFile(mockFile, 'user-1')).rejects.toThrow(BadRequestException);
      expect(cloudinary.uploadFile).not.toHaveBeenCalled();
    });

    it('should upload to Cloudinary and create DB record if within quota', async () => {
      prisma.file.aggregate.mockResolvedValue({
        _sum: { size: 1024 * 1024 }, // 1 MB used
      });
      prisma.file.create.mockResolvedValue({
        id: 'file-1',
        name: 'test.png',
        originalName: 'test.png',
        url: 'http://example.com/file.jpg',
        ownerId: 'user-1',
      });
      prisma.activityLog.create.mockResolvedValue({});

      const mockFile: any = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 2048,
        buffer: Buffer.from('abc'),
      };

      const res = await service.uploadFile(mockFile, 'user-1');
      expect(cloudinary.uploadFile).toHaveBeenCalled();
      expect(prisma.file.create).toHaveBeenCalled();
      expect(res.file).toHaveProperty('id', 'file-1');
    });
  });

  describe('renameFile', () => {
    it('should throw NotFoundException if user is not owner or file missing', async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      await expect(service.renameFile('f-1', 'user-1', 'new.txt')).rejects.toThrow(NotFoundException);
    });

    it('should update name if owner', async () => {
      prisma.file.findFirst.mockResolvedValue({
        id: 'f-1',
        ownerId: 'user-1',
        name: 'orig.txt',
        originalName: 'orig.txt',
      });
      prisma.file.update.mockResolvedValue({
        id: 'f-1',
        name: 'new.txt',
      });
      prisma.activityLog.create.mockResolvedValue({});

      const res = await service.renameFile('f-1', 'user-1', 'new.txt');
      expect(prisma.file.update).toHaveBeenCalled();
      expect(res.file).toHaveProperty('name', 'new.txt');
    });
  });

  describe('moveFile', () => {
    it('should reject moving into a folder owned by another user', async () => {
      prisma.file.findFirst.mockResolvedValue({ id: 'f-1', ownerId: 'user-1' });
      prisma.folder.findFirst.mockResolvedValue(null);

      await expect(service.moveFile('f-1', 'user-1', 'fold-2')).rejects.toThrow(NotFoundException);
    });

    it('should move to target folder if owned', async () => {
      prisma.file.findFirst.mockResolvedValue({ id: 'f-1', ownerId: 'user-1' });
      prisma.folder.findFirst.mockResolvedValue({ id: 'fold-1', ownerId: 'user-1' });
      prisma.file.update.mockResolvedValue({ id: 'f-1', folderId: 'fold-1' });
      prisma.activityLog.create.mockResolvedValue({});

      const res = await service.moveFile('f-1', 'user-1', 'fold-1');
      expect(prisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { folderId: 'fold-1' } })
      );
      expect(res.file).toHaveProperty('folderId', 'fold-1');
    });
  });

  describe('copyFile', () => {
    it('should duplicate record safely', async () => {
      prisma.file.findFirst.mockResolvedValue({
        id: 'f-1',
        name: 'orig.png',
        originalName: 'orig.png',
        url: 'http://cdn/orig.png',
        publicId: 'pid-1',
        size: 500,
        mimeType: 'image/png',
        ownerId: 'user-1',
        folderId: null,
      });
      prisma.file.aggregate.mockResolvedValue({ _sum: { size: 100 } });
      prisma.file.create.mockResolvedValue({
        id: 'f-copy',
        name: 'orig_copy.png',
        publicId: 'pid-1',
      });
      prisma.activityLog.create.mockResolvedValue({});

      const res = await service.copyFile('f-1', 'user-1');
      expect(prisma.file.create).toHaveBeenCalled();
      expect(res.file).toHaveProperty('id', 'f-copy');
    });
  });

  describe('permanentlyDelete', () => {
    it('should only delete Cloudinary asset if no siblings share the publicId', async () => {
      prisma.file.findFirst.mockResolvedValue({
        id: 'f-1',
        ownerId: 'user-1',
        publicId: 'shared-pid',
      });
      prisma.file.count.mockResolvedValue(1); // sibling count > 0
      prisma.file.delete.mockResolvedValue({});

      await service.permanentlyDelete('f-1', 'user-1');
      expect(cloudinary.deleteFile).not.toHaveBeenCalled();
      expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 'f-1' } });
    });
  });
});
