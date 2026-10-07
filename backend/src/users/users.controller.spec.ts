import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any;

  beforeEach(async () => {
    usersService = {
      getProfile: jest.fn().mockResolvedValue({ id: 'u-1', email: 'test@example.com' }),
      updateProfile: jest.fn().mockResolvedValue({ id: 'u-1', name: 'New Name' }),
      changePassword: jest.fn().mockResolvedValue({ message: 'Password updated' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get profile', async () => {
    const user = { id: 'u-1' };
    const res = await controller.getProfile(user);
    expect(usersService.getProfile).toHaveBeenCalledWith('u-1');
    expect(res).toHaveProperty('email');
  });

  it('should update profile', async () => {
    const user = { id: 'u-1' };
    const res = await controller.updateProfile(user, 'New Name');
    expect(usersService.updateProfile).toHaveBeenCalledWith('u-1', 'New Name');
    expect(res).toHaveProperty('name', 'New Name');
  });
});
