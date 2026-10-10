import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn((id, opts, cb) => {
        if (typeof opts === 'function') opts(null, { result: 'ok' });
        else if (typeof cb === 'function') cb(null, { result: 'ok' });
      }),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const configService = {
      get: jest.fn((key: string) => `mock-${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delete file via cloudinary uploader', async () => {
    const res = await service.deleteFile('pid-123', 'image/png');
    expect(cloudinary.uploader.destroy).toHaveBeenCalled();
    expect(res).toEqual({ result: 'ok' });
  });

  it('should throw BadRequestException if file buffer is missing or empty', async () => {
    const invalidFile: any = { originalname: 'test.png', mimetype: 'image/png', buffer: Buffer.from('') };
    await expect(service.uploadFile(invalidFile)).rejects.toThrow();
  });

  it('should reject with Error when cloudinary callback returns error', async () => {
    const mockStream: any = {
      on: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts, cb) => {
      // Simulate Cloudinary callback error
      setTimeout(() => cb({ message: 'cloud_name is disabled', http_code: 401 }, null), 0);
      return mockStream;
    });

    const mockFile: any = {
      originalname: 'test.png',
      mimetype: 'image/png',
      buffer: Buffer.from('data'),
      size: 4,
    };

    await expect(service.uploadFile(mockFile)).rejects.toThrow('Cloudinary upload failed: cloud_name is disabled');
  });

  it('should resolve with result when cloudinary upload succeeds', async () => {
    const mockStream: any = {
      on: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts, cb) => {
      setTimeout(() => cb(null, { secure_url: 'https://res.cloudinary.com/test.png', public_id: 'pid-1', bytes: 100 }), 0);
      return mockStream;
    });

    const mockFile: any = {
      originalname: 'test.png',
      mimetype: 'image/png',
      buffer: Buffer.from('data'),
      size: 4,
    };

    const res = await service.uploadFile(mockFile);
    expect(res).toHaveProperty('secure_url', 'https://res.cloudinary.com/test.png');
    expect(res).toHaveProperty('public_id', 'pid-1');
  });
});
