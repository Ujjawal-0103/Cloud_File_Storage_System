import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import 'multer';

@Injectable()
export class CloudinaryService {

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }
async uploadFile(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'cloudvault',
          resource_type: 'auto', // <--- This is the magic key!
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      ).end(file.buffer);
    });
  }

  async deleteFile(publicId: string, mimeType?: string) {
    let resourceType: 'image' | 'raw' | 'video' = 'image';
    if (mimeType) {
      const lower = mimeType.toLowerCase();
      if (
        lower.includes('pdf') ||
        lower.includes('doc') ||
        lower.includes('text') ||
        lower.includes('zip') ||
        lower.includes('application') ||
        lower.includes('json') ||
        lower.includes('octet-stream')
      ) {
        resourceType = 'raw';
      } else if (lower.includes('video') || lower.includes('audio')) {
        resourceType = 'video';
      }
    }

    return new Promise((resolve) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error, result) => {
          if (!error && result?.result === 'ok') {
            return resolve(result);
          }
          // Fallback to other resource type if not found under initial type
          const fallbackType = resourceType === 'image' ? 'raw' : 'image';
          cloudinary.uploader.destroy(
            publicId,
            { resource_type: fallbackType },
            (fallbackErr, fallbackRes) => {
              resolve(fallbackRes || result);
            },
          );
        },
      );
    });
  }
}