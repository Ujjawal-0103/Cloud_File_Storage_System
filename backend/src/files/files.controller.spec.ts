import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let filesService: any;

  beforeEach(async () => {
    filesService = {
      uploadFile: jest.fn().mockResolvedValue({ id: 'f-1', name: 'uploaded.png' }),
      renameFile: jest.fn().mockResolvedValue({ id: 'f-1', name: 'renamed.png' }),
      moveFile: jest.fn().mockResolvedValue({ id: 'f-1', folderId: 'dest-folder' }),
      copyFile: jest.fn().mockResolvedValue({ id: 'f-copy', name: 'copy.png' }),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: 'f-1' }),
      moveToTrash: jest.fn().mockResolvedValue({ id: 'f-1', deletedAt: new Date() }),
      restoreFromTrash: jest.fn().mockResolvedValue({ id: 'f-1', deletedAt: null }),
      permanentlyDelete: jest.fn().mockResolvedValue({ id: 'f-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: filesService }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle upload', async () => {
    const mockFile: any = { originalname: 'test.jpg' };
    const user: any = { id: 'user-1', email: 'u@u.com' };
    const res = await controller.uploadFile(mockFile, user, undefined);
    expect(filesService.uploadFile).toHaveBeenCalledWith(mockFile, 'user-1', undefined);
    expect(res).toHaveProperty('id', 'f-1');
  });

  it('should handle rename', async () => {
    const user: any = { id: 'user-1', email: 'u@u.com' };
    const res = await controller.renameFile('f-1', user, 'renamed.png');
    expect(filesService.renameFile).toHaveBeenCalledWith('f-1', 'user-1', 'renamed.png');
    expect(res).toHaveProperty('name', 'renamed.png');
  });

  it('should handle move', async () => {
    const user: any = { id: 'user-1', email: 'u@u.com' };
    const res = await controller.moveFile('f-1', user, 'dest-folder');
    expect(filesService.moveFile).toHaveBeenCalledWith('f-1', 'user-1', 'dest-folder');
    expect(res).toHaveProperty('folderId', 'dest-folder');
  });

  it('should handle copy', async () => {
    const user: any = { id: 'user-1', email: 'u@u.com' };
    const res = await controller.copyFile('f-1', user, undefined);
    expect(filesService.copyFile).toHaveBeenCalledWith('f-1', 'user-1', undefined);
    expect(res).toHaveProperty('name', 'copy.png');
  });
});
