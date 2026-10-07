import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;
  let usersService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwt = {
      sign: jest.fn().mockReturnValue('mock-token'),
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verifyAsync: jest.fn(),
    };

    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });
      await expect(
        service.register({ email: 'test@example.com', password: 'password123', name: 'Test' })
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return sanitized user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'new-id',
        email: 'test@example.com',
        name: 'Test',
        password: 'hashed-password',
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      });

      expect(result).toHaveProperty('id', 'new-id');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongPassword' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        password: hashedPassword,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token', 'mock-token');
      expect(result).toHaveProperty('refresh_token', 'mock-token');
    });
  });

  describe('logout', () => {
    it('should nullify refresh token in database', async () => {
      prisma.user.update.mockResolvedValue({});
      const result = await service.logout('user-1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
      expect(result).toHaveProperty('message');
    });
  });

  describe('forgotPassword', () => {
    it('should return safe message even if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const res = await service.forgotPassword({ email: 'ghost@example.com' });
      expect(res).toHaveProperty('message');
    });

    it('should store reset token when user exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      prisma.user.update.mockResolvedValue({});
      const res = await service.forgotPassword({ email: 'test@example.com' });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(res).toHaveProperty('message');
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is invalid or expired', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: 'bad-token', newPassword: 'new-pass-123' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password and clear reset token', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockResolvedValue({});
      const res = await service.resetPassword({ token: 'valid-token', newPassword: 'new-pass-123' });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(res).toHaveProperty('message');
    });
  });

  describe('getGoogleAuthUrl', () => {
    it('should return error URL when clientId is missing', () => {
      const url = service.getGoogleAuthUrl();
      expect(url).toContain('login?error=');
    });
  });
});
