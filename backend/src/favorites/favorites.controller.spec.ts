import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let favoritesService: any;

  beforeEach(async () => {
    favoritesService = {
      addFavorite: jest.fn().mockResolvedValue({ id: 'fav-1' }),
      removeFavorite: jest.fn().mockResolvedValue({ message: 'Removed' }),
      getFavorites: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [{ provide: FavoritesService, useValue: favoritesService }],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call addFavorite', async () => {
    const user: any = { id: 'user-1', email: 'test@example.com' };
    const res = await controller.addFavorite('file-1', user);
    expect(favoritesService.addFavorite).toHaveBeenCalledWith('user-1', 'file-1');
    expect(res).toHaveProperty('id', 'fav-1');
  });

  it('should call removeFavorite', async () => {
    const user: any = { id: 'user-1', email: 'test@example.com' };
    const res = await controller.removeFavorite('file-1', user);
    expect(favoritesService.removeFavorite).toHaveBeenCalledWith('user-1', 'file-1');
    expect(res).toHaveProperty('message');
  });
});
