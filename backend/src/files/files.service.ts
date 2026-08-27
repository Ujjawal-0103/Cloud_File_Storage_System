import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
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
    const skip = (page - 1) * limit;

    const where: any = {
      ownerId: userId,
      deletedAt: null,
    };

    // Only filter by folder when folderId is actually provided.
    if (folderId) {
      where.folderId = folderId;
    }

    // Optional MIME type filter.
    if (mimeType) {
      where.mimeType = {
        contains: mimeType,
        mode: 'insensitive',
      };
    }

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: limit,
      }),

      this.prisma.file.count({
        where,
      }),
    ]);

    return {
      data: files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRecentFiles(
    userId: string,
    limit = 10,
  ) {
    return this.prisma.file.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });
  }

  async getStorageUsage(userId: string) {
    const result = await this.prisma.file.aggregate({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      _sum: {
        size: true,
      },
      _count: {
        id: true,
      },
    });

    const usedBytes = result._sum.size ?? 0;
    const fileCount = result._count.id;

    return {
      usedBytes,
      usedKB: Number((usedBytes / 1024).toFixed(2)),
      usedMB: Number((usedBytes / (1024 * 1024)).toFixed(2)),
      usedGB: Number(
        (usedBytes / (1024 * 1024 * 1024)).toFixed(4),
      ),
      fileCount,
    };
  }

  async uploadFile(
    file: any,
    userId: string,
    folderId?: string,
  ) {
    const result: any =
      await this.cloudinaryService.uploadFile(file);

    const savedFile =
      await this.prisma.file.create({
        data: {
          name: result.public_id,
          originalName: file.originalname,
          url: result.secure_url,
          publicId: result.public_id,
          size: file.size,
          mimeType: file.mimetype,
          ownerId: userId,
          folderId: folderId || null,
        },
      });

    return {
      message: 'File uploaded successfully',
      file: savedFile,
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
      throw new NotFoundException(
        'File not found or already in trash',
      );
    }

    const updatedFile = await this.prisma.file.update({
      where: {
        id: file.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'File moved to trash',
      file: updatedFile,
    };
  }

}