import { Test, TestingModule } from '@nestjs/testing';
import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';

describe('TrashController', () => {
  let controller: TrashController;
  let trashService: any;

  beforeEach(async () => {
    trashService = {
      getTrash: jest.fn().mockResolvedValue({ folders: [], files: [] }),
      restoreFile: jest.fn().mockResolvedValue({ message: 'Restored' }),
      restoreFolder: jest.fn().mockResolvedValue({ message: 'Restored' }),
      permanentlyDeleteFile: jest.fn().mockResolvedValue({ message: 'Deleted' }),
      permanentlyDeleteFolder: jest.fn().mockResolvedValue({ message: 'Deleted' }),
      emptyTrash: jest.fn().mockResolvedValue({ message: 'Emptied' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrashController],
      providers: [{ provide: TrashService, useValue: trashService }],
    }).compile();

    controller = module.get<TrashController>(TrashController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get trash', async () => {
    const user = { id: 'user-1' };
    const res = await controller.getTrash(user);
    expect(trashService.getTrash).toHaveBeenCalledWith('user-1');
    expect(res).toHaveProperty('folders');
  });
});
