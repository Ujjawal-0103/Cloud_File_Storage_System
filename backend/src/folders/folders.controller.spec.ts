import { Test, TestingModule } from '@nestjs/testing';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

describe('FoldersController', () => {
  let controller: FoldersController;
  let foldersService: any;

  beforeEach(async () => {
    foldersService = {
      create: jest.fn().mockResolvedValue({ id: 'fold-1', name: 'Work' }),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: 'fold-1' }),
      update: jest.fn().mockResolvedValue({ id: 'fold-1', name: 'Updated' }),
      softDelete: jest.fn().mockResolvedValue({ id: 'fold-1' }),
      restore: jest.fn().mockResolvedValue({ id: 'fold-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoldersController],
      providers: [{ provide: FoldersService, useValue: foldersService }],
    }).compile();

    controller = module.get<FoldersController>(FoldersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create folder', async () => {
    const user = { id: 'user-1' };
    const res = await controller.create(user, { name: 'Work' });
    expect(foldersService.create).toHaveBeenCalledWith('user-1', { name: 'Work' });
    expect(res).toHaveProperty('id', 'fold-1');
  });

  it('should find all folders for user', async () => {
    const user = { id: 'user-1' };
    const res = await controller.findAll(user);
    expect(foldersService.findAll).toHaveBeenCalledWith('user-1');
    expect(Array.isArray(res)).toBe(true);
  });
});
