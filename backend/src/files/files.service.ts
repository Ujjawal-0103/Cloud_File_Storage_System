import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private cloudinaryService: CloudinaryService,
    private prisma: PrismaService,
  ) {}

  async findAll(folderId?: string, userId?: string) {
    return this.prisma.file.findMany({
      where: {
        folderId: folderId || null,
        ownerId: userId,
      },
    });
  }

  async uploadFile(
    file: any,
    userId: string,
    folderId?: string,
  ) {
    // Upload file to Cloudinary
    const result: any = await this.cloudinaryService.uploadFile(file);

    // Save file information in PostgreSQL, linking it to the folder if provided
    const savedFile = await this.prisma.file.create({
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
    // 1. Find the file and ensure it belongs to the authenticated user
    const file = await this.prisma.file.findFirst({
      where: { id, ownerId: userId },
    });

    if (!file) {
      throw new NotFoundException('File not found or unauthorized');
    }

    // 2. Delete the file from Cloudinary using its stored publicId
    if (file.publicId) {
      try {
        const cloudinary = this.cloudinaryService as any;
        if (typeof cloudinary.deleteFile === 'function') {
          await cloudinary.deleteFile(file.publicId);
        }
      } catch (error) {
        console.error('Error deleting asset from Cloudinary:', error);
      }
    }

    // 3. Delete the record from PostgreSQL
    await this.prisma.file.delete({
      where: { id },
    });

    return {
      message: 'File deleted successfully',
      id,
    };
  }
}