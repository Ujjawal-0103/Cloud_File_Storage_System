import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Add a file to favorites
  async addFavorite(
    userId: string,
    fileId: string,
  ) {
    // Check that the file belongs to the logged-in user
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
      },
    });

    if (!file) {
      throw new NotFoundException(
        'File not found or unauthorized',
      );
    }

    // Prevent duplicate favorites
    const existingFavorite =
      await this.prisma.favorite.findUnique({
        where: {
          userId_fileId: {
            userId,
            fileId,
          },
        },
      });

    if (existingFavorite) {
      throw new ConflictException(
        'File is already in favorites',
      );
    }

    return this.prisma.favorite.create({
      data: {
        userId,
        fileId,
      },
      include: {
        file: true,
      },
    });
  }

  // Get all favorites belonging to the logged-in user
  async getFavorites(userId: string, page?: number, limit?: number) {
    if (page && limit) {
      const pageNum = Math.max(1, page);
      const limitNum = Math.min(100, Math.max(1, limit));
      const skip = (pageNum - 1) * limitNum;

      const [total, favorites] = await Promise.all([
        this.prisma.favorite.count({
          where: {
            userId,
            file: { deletedAt: null },
          },
        }),
        this.prisma.favorite.findMany({
          where: {
            userId,
            file: { deletedAt: null },
          },
          include: {
            file: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limitNum,
        }),
      ]);

      return {
        total,
        page: pageNum,
        limit: limitNum,
        pageSize: limitNum,
        totalPages: Math.ceil(total / limitNum),
        favorites,
        items: favorites,
        data: favorites,
      };
    }

    return this.prisma.favorite.findMany({
      where: {
        userId,
        file: {
          deletedAt: null,
        },
      },
      include: {
        file: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Remove a file from favorites
  async removeFavorite(
    userId: string,
    fileId: string,
  ) {
    const favorite =
      await this.prisma.favorite.findUnique({
        where: {
          userId_fileId: {
            userId,
            fileId,
          },
        },
      });

    if (!favorite) {
      throw new NotFoundException(
        'Favorite not found',
      );
    }

    await this.prisma.favorite.delete({
      where: {
        userId_fileId: {
          userId,
          fileId,
        },
      },
    });

    return {
      message: 'File removed from favorites',
      fileId,
    };
  }
}