import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class TrashService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Get all trashed files
  async getTrash(userId: string) {
    return this.prisma.file.findMany({
      where: {
        ownerId: userId,
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  // Restore a file from trash
  async restoreFile(
    fileId: string,
    userId: string,
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!file) {
      throw new NotFoundException(
        'Trashed file not found or unauthorized',
      );
    }

    const restoredFile =
      await this.prisma.file.update({
        where: {
          id: file.id,
        },
        data: {
          deletedAt: null,
        },
      });

    return {
      message: 'File restored successfully',
      file: restoredFile,
    };
  }

  // Permanently delete a file
  async permanentlyDeleteFile(
    fileId: string,
    userId: string,
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!file) {
      throw new NotFoundException(
        'Trashed file not found or unauthorized',
      );
    }

    // Delete the actual file from Cloudinary
    if (file.publicId) {
      try {
        await this.cloudinaryService.deleteFile(
          file.publicId,
        );
      } catch (error) {
        console.error(
          'Error deleting file from Cloudinary:',
          error,
        );

        throw new Error(
          'Failed to delete file from cloud storage',
        );
      }
    }

    // Delete the file metadata from PostgreSQL
    await this.prisma.file.delete({
      where: {
        id: file.id,
      },
    });

    return {
      message: 'File permanently deleted',
      id: file.id,
    };
  }
}