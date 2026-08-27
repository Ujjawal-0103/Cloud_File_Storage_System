import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, query: string) {
    const [files, folders] = await Promise.all([
      this.prisma.file.findMany({
        where: {
          ownerId: userId,
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),

      this.prisma.folder.findMany({
        where: {
          ownerId: userId,
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);

    return {
      files,
      folders,
    };
  }
}