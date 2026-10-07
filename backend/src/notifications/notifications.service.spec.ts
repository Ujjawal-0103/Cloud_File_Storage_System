import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification for a user', async () => {
      const mockNotif = {
        id: 'n-1',
        userId: 'u-1',
        type: NotificationType.SHARE_RECEIVED,
        title: 'File shared',
        message: 'Alice shared doc.pdf',
        read: false,
        createdAt: new Date(),
      };
      prisma.notification.create.mockResolvedValue(mockNotif);

      const result = await service.create({
        userId: 'u-1',
        type: NotificationType.SHARE_RECEIVED,
        title: 'File shared',
        message: 'Alice shared doc.pdf',
      });

      expect(result).toEqual(mockNotif);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u-1',
          type: NotificationType.SHARE_RECEIVED,
          title: 'File shared',
          message: 'Alice shared doc.pdf',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated user notifications with unread count', async () => {
      prisma.notification.count.mockResolvedValueOnce(5); // total
      prisma.notification.count.mockResolvedValueOnce(2); // unread
      prisma.notification.findMany.mockResolvedValueOnce([{ id: 'n-1' }, { id: 'n-2' }]);

      const result = await service.findAll('u-1', 1, 10);

      expect(result.total).toBe(5);
      expect(result.unread).toBe(2);
      expect(result.data.length).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('u-1');

      expect(result).toEqual({ unreadCount: 3 });
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'u-1', read: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification not found or belongs to another user', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('invalid-id', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('should mark notification as read', async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: 'n-1', userId: 'u-1', read: false });
      prisma.notification.update.mockResolvedValue({ id: 'n-1', read: true });

      const result = await service.markAsRead('n-1', 'u-1');

      expect(result.read).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n-1' },
        data: { read: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 4 });

      const result = await service.markAllAsRead('u-1');

      expect(result).toEqual({
        message: 'All notifications marked as read',
        count: 4,
      });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-1', read: false },
        data: { read: true },
      });
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if not found or unauthorized', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.remove('n-99', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('should delete notification if user is owner', async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: 'n-1', userId: 'u-1' });
      prisma.notification.delete.mockResolvedValue({ id: 'n-1' });

      const result = await service.remove('n-1', 'u-1');

      expect(result).toEqual({ message: 'Notification removed successfully' });
      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'n-1' } });
    });
  });
});
