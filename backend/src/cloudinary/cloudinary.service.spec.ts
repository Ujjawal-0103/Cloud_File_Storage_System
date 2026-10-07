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
});
