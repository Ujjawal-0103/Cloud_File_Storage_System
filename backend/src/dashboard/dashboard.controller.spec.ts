import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { BadRequestException } from '@nestjs/common';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: any;

  beforeEach(async () => {
    service = {
      getDashboardData: jest.fn().mockResolvedValue({
        storage: { usedBytes: 1000 },
        files: { total: 2 },
      }),
      getRecentActivity: jest.fn().mockResolvedValue({
        activities: [],
        total: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: service }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should call service.getDashboardData with current user id', async () => {
      const user = { id: 'usr-1', email: 'test@example.com' };
      const res = await controller.getDashboard(user);
      expect(service.getDashboardData).toHaveBeenCalledWith('usr-1');
      expect(res).toBeDefined();
    });
  });

  describe('getRecentActivity', () => {
    it('should call service.getRecentActivity with parsed page and limit', async () => {
      const user = { id: 'usr-1', email: 'test@example.com' };
      await controller.getRecentActivity('2', '15', user);
      expect(service.getRecentActivity).toHaveBeenCalledWith('usr-1', 2, 15);
    });

    it('should reject invalid page or limit', async () => {
      const user = { id: 'usr-1', email: 'test@example.com' };
      await expect(
        controller.getRecentActivity('0', '10', user),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getRecentActivity('1', '100', user),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
