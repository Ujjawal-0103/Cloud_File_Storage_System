import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1', email: 'test@example.com' });
    const user = await service.findByEmail('test@example.com');
    expect(user).toHaveProperty('id', 'u-1');
  });

  it('should get profile', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1', email: 'test@example.com', name: 'Tester' });
    const profile = await service.getProfile('u-1');
    expect(profile).toHaveProperty('email', 'test@example.com');
  });
});
