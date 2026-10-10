import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import 'multer';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    this.configureCloudinary();
  }

  private configureCloudinary() {
    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.logger.log(`[Cloudinary] Configured successfully for cloud "${cloudName}"`);
    } else {
      this.logger.warn(
        `[Cloudinary] Initialization warning - Missing environment variables: ` +
        `CLOUDINARY_CLOUD_NAME=${cloudName ? 'configured' : 'MISSING'}, ` +
        `CLOUDINARY_API_KEY=${apiKey ? 'configured' : 'MISSING'}, ` +
        `CLOUDINARY_API_SECRET=${apiSecret ? 'configured' : 'MISSING'}.`,
      );
    }
  }

  public isConfigured(): boolean {
    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET;

    return Boolean(cloudName && apiKey && apiSecret);
  }

  async uploadFile(file: Express.Multer.File): Promise<any> {
    if (!this.isConfigured()) {
      const cloudName =
        this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
        process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey =
        this.configService.get<string>('CLOUDINARY_API_KEY') ||
        process.env.CLOUDINARY_API_KEY;
      const apiSecret =
        this.configService.get<string>('CLOUDINARY_API_SECRET') ||
        process.env.CLOUDINARY_API_SECRET;

      this.logger.error(
        `[Cloudinary] Upload blocked: Cloudinary credentials are not configured on server. ` +
        `CLOUDINARY_CLOUD_NAME=${cloudName ? 'configured' : 'MISSING'}, ` +
        `CLOUDINARY_API_KEY=${apiKey ? 'configured' : 'MISSING'}, ` +
        `CLOUDINARY_API_SECRET=${apiSecret ? 'configured' : 'MISSING'}. ` +
        `Please configure these in Render Web Service Environment settings.`,
      );
      throw new BadRequestException(
        'Cloud storage service is not properly configured on server. Please check Cloudinary environment variables.',
      );
    }

    if (!file || !file.buffer || file.buffer.length === 0) {
      this.logger.error('[Cloudinary] Upload failed: File buffer is empty or missing');
      throw new BadRequestException('Uploaded file buffer is empty or missing');
    }

    this.logger.log(
      `[Cloudinary] Initiating stream upload: "${file.originalname}" (${file.size || file.buffer.length} bytes, ${file.mimetype})`,
    );

    return new Promise((resolve, reject) => {
      let isSettled = false;

      const safeReject = (err: any) => {
        if (!isSettled) {
          isSettled = true;
          reject(err);
        }
      };

      const safeResolve = (res: any) => {
        if (!isSettled) {
          isSettled = true;
          resolve(res);
        }
      };

      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'cloudvault',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              const errorMsg =
                typeof error === 'string'
                  ? error
                  : error.message || JSON.stringify(error);
              this.logger.error(
                `[Cloudinary] Upload failed for "${file.originalname}": ${errorMsg}`,
              );
              const err = new Error(`Cloudinary upload failed: ${errorMsg}`);
              (err as any).cloudinaryError = error;
              safeReject(err);
            } else if (!result || !result.secure_url) {
              this.logger.error(
                `[Cloudinary] Upload succeeded but returned invalid result structure for "${file.originalname}"`,
              );
              safeReject(
                new Error('Cloudinary returned invalid upload result structure'),
              );
            } else {
              this.logger.log(
                `[Cloudinary] Upload completed successfully for "${file.originalname}": public_id=${result.public_id}, bytes=${result.bytes}`,
              );
              safeResolve(result);
            }
          },
        );

        uploadStream.on('error', (streamErr: any) => {
          const msg = streamErr?.message || String(streamErr);
          this.logger.error(
            `[Cloudinary] Stream error for "${file.originalname}": ${msg}`,
          );
          safeReject(new Error(`Cloudinary stream error: ${msg}`));
        });

        uploadStream.end(file.buffer);
      } catch (syncErr: any) {
        const msg = syncErr?.message || String(syncErr);
        this.logger.error(
          `[Cloudinary] Synchronous upload initialization error: ${msg}`,
        );
        safeReject(new Error(`Cloudinary initialization error: ${msg}`));
      }
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