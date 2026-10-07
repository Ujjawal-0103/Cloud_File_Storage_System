import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      file: { findFirst: jest.fn() },
      favorite: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if file not found or unauthorized', async () => {
    prisma.file.findFirst.mockResolvedValue(null);
    await expect(service.addFavorite('user-1', 'file-1')).rejects.toThrow(NotFoundException);
  });

  it('should add to favorites when file belongs to user', async () => {
    prisma.file.findFirst.mockResolvedValue({ id: 'file-1', ownerId: 'user-1' });
    prisma.favorite.findUnique.mockResolvedValue(null);
    prisma.favorite.create.mockResolvedValue({ id: 'fav-1', fileId: 'file-1', userId: 'user-1' });

    const res = await service.addFavorite('user-1', 'file-1');
    expect(res).toHaveProperty('id', 'fav-1');
  });
});
