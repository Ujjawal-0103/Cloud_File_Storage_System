import { Test, TestingModule } from '@nestjs/testing';
import { TrashService } from './trash.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FoldersService } from '../folders/folders.service';

describe('TrashService', () => {
  let service: TrashService;
  let prisma: any;
  let cloudinary: any;
  let foldersService: any;

  beforeEach(async () => {
    prisma = {
      folder: { findMany: jest.fn().mockResolvedValue([]) },
      file: { findMany: jest.fn().mockResolvedValue([]) },
    };

    cloudinary = {
      deleteFile: jest.fn().mockResolvedValue(true),
    };

    foldersService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrashService,
        { provide: PrismaService, useValue: prisma },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: FoldersService, useValue: foldersService },
      ],
    }).compile();

    service = module.get<TrashService>(TrashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return trashed files and folders', async () => {
    const res = await service.getTrash('user-1');
    expect(res).toHaveProperty('folders');
    expect(res).toHaveProperty('files');
  });
});
