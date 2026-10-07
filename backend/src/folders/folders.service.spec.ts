import { Test, TestingModule } from '@nestjs/testing';
import { FoldersService } from './folders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotFoundException } from '@nestjs/common';

describe('FoldersService', () => {
  let service: FoldersService;
  let prisma: any;
  let cloudinary: any;

  beforeEach(async () => {
    prisma = {
      folder: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      file: {
        findMany: jest.fn(),
      },
    };

    cloudinary = {
      deleteFile: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoldersService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    service = module.get<FoldersService>(FoldersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if parent folder does not exist', async () => {
      prisma.folder.findFirst.mockResolvedValue(null);
      await expect(
        service.create('user-1', { name: 'Subfolder', parentId: 'bad-parent' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should create root folder successfully', async () => {
      prisma.folder.create.mockResolvedValue({
        id: 'fold-1',
        name: 'Documents',
        ownerId: 'user-1',
        parentId: null,
      });

      const res = await service.create('user-1', { name: 'Documents' });
      expect(prisma.folder.create).toHaveBeenCalled();
      expect(res).toHaveProperty('id', 'fold-1');
    });
  });
});
