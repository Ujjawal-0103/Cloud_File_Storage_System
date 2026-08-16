import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private cloudinaryService: CloudinaryService,
    private prisma: PrismaService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ) {
    // Upload file to Cloudinary
    const result: any = await this.cloudinaryService.uploadFile(file);

    // Save file information in PostgreSQL
    const savedFile = await this.prisma.file.create({
      data: {
        name: result.public_id,
        originalName: file.originalname,
        url: result.secure_url,
        publicId: result.public_id,
        size: file.size,
        mimeType: file.mimetype,
        ownerId: userId,
      },
    });

    return {
      message: 'File uploaded successfully',
      file: savedFile,
    };
  }
}