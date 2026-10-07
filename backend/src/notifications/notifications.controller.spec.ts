import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: any;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get all notifications for current user', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0 });
    const result = await controller.findAll({ id: 'u-1' }, 1, 20);
    expect(service.findAll).toHaveBeenCalledWith('u-1', 1, 20);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should get unread count', async () => {
    service.getUnreadCount.mockResolvedValue({ unreadCount: 3 });
    const result = await controller.getUnreadCount({ id: 'u-1' });
    expect(service.getUnreadCount).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ unreadCount: 3 });
  });

  it('should mark one as read', async () => {
    service.markAsRead.mockResolvedValue({ id: 'n-1', read: true });
    const result = await controller.markAsRead('n-1', { id: 'u-1' });
    expect(service.markAsRead).toHaveBeenCalledWith('n-1', 'u-1');
    expect(result.read).toBe(true);
  });

  it('should mark all as read', async () => {
    service.markAllAsRead.mockResolvedValue({ count: 5 });
    const result = await controller.markAllAsRead({ id: 'u-1' });
    expect(service.markAllAsRead).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ count: 5 });
  });

  it('should delete a notification', async () => {
    service.remove.mockResolvedValue({ message: 'Deleted' });
    const result = await controller.remove('n-1', { id: 'u-1' });
    expect(service.remove).toHaveBeenCalledWith('n-1', 'u-1');
    expect(result).toEqual({ message: 'Deleted' });
  });
});
