import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: any;

  beforeEach(async () => {
    searchService = {
      search: jest.fn().mockResolvedValue({ files: [], folders: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: searchService }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call search', async () => {
    const user = { id: 'user-1' };
    const res = await controller.search(user, 'query');
    expect(searchService.search).toHaveBeenCalledWith('user-1', 'query');
    expect(res).toHaveProperty('files');
  });
});
