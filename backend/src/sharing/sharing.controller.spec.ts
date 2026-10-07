import { Test, TestingModule } from '@nestjs/testing';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';

describe('SharingController', () => {
  let controller: SharingController;
  let sharingService: any;

  beforeEach(async () => {
    sharingService = {
      shareFile: jest.fn().mockResolvedValue({ message: 'Shared' }),
      shareFolder: jest.fn().mockResolvedValue({ message: 'Shared' }),
      createPublicShare: jest.fn().mockResolvedValue({ publicToken: 'tok123' }),
      getPublicShare: jest.fn().mockResolvedValue({ file: { id: 'f-1' } }),
      revokePublicShare: jest.fn().mockResolvedValue({ message: 'Revoked' }),
      getReceivedShares: jest.fn().mockResolvedValue([]),
      getSentShares: jest.fn().mockResolvedValue([]),
      updateSharePermission: jest.fn().mockResolvedValue({ message: 'Updated' }),
      revokeShare: jest.fn().mockResolvedValue({ message: 'Revoked' }),
      getFileAccess: jest.fn().mockResolvedValue({ permission: 'VIEW' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharingController],
      providers: [{ provide: SharingService, useValue: sharingService }],
    }).compile();

    controller = module.get<SharingController>(SharingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call shareFile', async () => {
    const req = { user: { id: 'user-1' } };
    const res = await controller.shareFile('f-1', { email: 'b@b.com', permission: 'VIEW' }, req);
    expect(sharingService.shareFile).toHaveBeenCalled();
    expect(res).toHaveProperty('message');
  });

  it('should call getPublicShare without requiring user in req', async () => {
    const res = await controller.getPublicShare('tok123');
    expect(sharingService.getPublicShare).toHaveBeenCalledWith('tok123');
    expect(res).toHaveProperty('file');
  });
});
