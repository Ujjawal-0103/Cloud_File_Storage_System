import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue({ user: { id: '1' }, accessToken: 'token' }),
      login: jest.fn().mockResolvedValue({ user: { id: '1' }, accessToken: 'token', refreshToken: 'r-token' }),
      refresh: jest.fn().mockResolvedValue({ accessToken: 'new-token', refreshToken: 'new-r-token' }),
      logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
      forgotPassword: jest.fn().mockResolvedValue({ message: 'Instructions sent' }),
      resetPassword: jest.fn().mockResolvedValue({ message: 'Password reset successfully' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call register', async () => {
    const dto = { email: 'test@example.com', password: 'password123', name: 'Test' };
    const res = await controller.register(dto);
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(res).toHaveProperty('accessToken');
  });

  it('should call login', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const res = await controller.login(dto);
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(res).toHaveProperty('accessToken');
  });

  it('should call refresh', async () => {
    const dto = { refreshToken: 'valid-refresh' };
    const res = await controller.refresh(dto);
    expect(authService.refresh).toHaveBeenCalledWith(dto);
    expect(res).toHaveProperty('accessToken');
  });

  it('should call logout', async () => {
    const user: any = { id: 'user-1' };
    const res = await controller.logout(user);
    expect(authService.logout).toHaveBeenCalledWith('user-1');
    expect(res).toHaveProperty('message');
  });
});
