import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ActivityType, NotificationType, Permission } from '@prisma/client';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { CreatePublicShareDto } from './dto/create-public-share.dto';

@Injectable()
export class SharingService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async shareFile(
    fileId: string,
    userId: string,
    createShareDto: CreateShareDto,
  ) {
    const { sharedWithId, email, permission } = createShareDto;

    // 1. Check file exists and not deleted
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check ownership
    if (file.ownerId !== userId) {
      throw new ForbiddenException('Only the file owner can share this file');
    }

    // 2. Resolve recipient by sharedWithId or email
    let recipient: any = null;
    if (sharedWithId) {
      recipient = await this.prisma.user.findUnique({
        where: { id: sharedWithId },
      });
    } else if (email) {
      recipient = await this.prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    } else {
      throw new BadRequestException('Recipient sharedWithId or email is required');
    }

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    // 3. Prevent self-share
    if (recipient.id === userId) {
      throw new ConflictException('You cannot share a file with yourself');
    }

    // 4. Prevent duplicate sharing
    const existingShare = await this.prisma.sharedItem.findFirst({
      where: {
        fileId: file.id,
        sharedWithId: recipient.id,
      },
    });

    if (existingShare) {
      throw new ConflictException('File is already shared with this user');
    }

    // 5. Create the sharing record
    const sharedItem = await this.prisma.sharedItem.create({
      data: {
        fileId: file.id,
        sharedById: userId,
        sharedWithId: recipient.id,
        permission: permission || Permission.VIEW,
      },
      include: {
        file: true,
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 6. Log sharing activity
    await this.prisma.activityLog.create({
      data: {
        action: ActivityType.SHARE,
        userId,
        fileId: file.id,
      },
    });

    // 7. Send in-app notification to recipient
    if (this.notificationsService) {
      try {
        const senderName = sharedItem.sharedBy?.name || sharedItem.sharedBy?.email || 'Someone';
        await this.notificationsService.create({
          userId: recipient.id,
          type: NotificationType.SHARE_RECEIVED,
          title: 'File shared with you',
          message: `${senderName} shared "${file.name}" with you (${sharedItem.permission} access)`,
          relatedEntityId: file.id,
          relatedEntityType: 'FILE',
        });
      } catch {
        // Non-blocking notification
      }
    }

    return {
      message: 'File shared successfully',
      share: sharedItem,
    };
  }

  async shareFolder(
    folderId: string,
    userId: string,
    createShareDto: CreateShareDto,
  ) {
    const { sharedWithId, email, permission } = createShareDto;

    // 1. Check folder exists and not deleted
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        deletedAt: null,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.ownerId !== userId) {
      throw new ForbiddenException('Only the folder owner can share this folder');
    }

    // 2. Resolve recipient
    let recipient: any = null;
    if (sharedWithId) {
      recipient = await this.prisma.user.findUnique({
        where: { id: sharedWithId },
      });
    } else if (email) {
      recipient = await this.prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    } else {
      throw new BadRequestException('Recipient sharedWithId or email is required');
    }

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    if (recipient.id === userId) {
      throw new ConflictException('You cannot share a folder with yourself');
    }

    // 3. Duplicate check
    const existingShare = await this.prisma.sharedItem.findFirst({
      where: {
        folderId: folder.id,
        sharedWithId: recipient.id,
      },
    });

    if (existingShare) {
      throw new ConflictException('Folder is already shared with this user');
    }

    const sharedItem = await this.prisma.sharedItem.create({
      data: {
        folderId: folder.id,
        sharedById: userId,
        sharedWithId: recipient.id,
        permission: permission || Permission.VIEW,
      },
      include: {
        folder: true,
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        action: ActivityType.SHARE,
        userId,
        folderId: folder.id,
      },
    });

    // Send in-app notification to recipient
    if (this.notificationsService) {
      try {
        const senderName = sharedItem.sharedBy?.name || sharedItem.sharedBy?.email || 'Someone';
        await this.notificationsService.create({
          userId: recipient.id,
          type: NotificationType.SHARE_RECEIVED,
          title: 'Folder shared with you',
          message: `${senderName} shared "${folder.name}" with you (${sharedItem.permission} access)`,
          relatedEntityId: folder.id,
          relatedEntityType: 'FOLDER',
        });
      } catch {
        // Non-blocking notification
      }
    }

    return {
      message: 'Folder shared successfully',
      share: sharedItem,
    };
  }

  async createPublicShare(userId: string, dto: CreatePublicShareDto) {
    const { fileId, folderId, permission, expiresAt } = dto;

    if (!fileId && !folderId) {
      throw new BadRequestException('Must provide either fileId or folderId');
    }

    let file: any = null;
    let folder: any = null;

    if (fileId) {
      file = await this.prisma.file.findFirst({
        where: { id: fileId, ownerId: userId, deletedAt: null },
      });
      if (!file) throw new NotFoundException('File not found or unauthorized');
    }

    if (folderId) {
      folder = await this.prisma.folder.findFirst({
        where: { id: folderId, ownerId: userId, deletedAt: null },
      });
      if (!folder) throw new NotFoundException('Folder not found or unauthorized');
    }

    // Generate cryptographic token
    const publicToken = crypto.randomBytes(16).toString('hex');
    let parsedExpiresAt: Date | null = null;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
    } else if (dto.expiresInHours && dto.expiresInHours > 0) {
      parsedExpiresAt = new Date(Date.now() + dto.expiresInHours * 3600 * 1000);
    }

    const share = await this.prisma.sharedItem.create({
      data: {
        fileId: file?.id || null,
        folderId: folder?.id || null,
        sharedById: userId,
        isPublic: true,
        publicToken,
        expiresAt: parsedExpiresAt,
        permission: permission || Permission.VIEW,
      },
      include: {
        file: true,
        folder: true,
        sharedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      message: 'Public link created successfully',
      publicToken,
      share,
    };
  }

  async getPublicShare(publicToken: string) {
    const share = await this.prisma.sharedItem.findFirst({
      where: {
        publicToken,
        isPublic: true,
      },
      include: {
        file: true,
        folder: {
          include: {
            files: {
              where: { deletedAt: null },
            },
          },
        },
        sharedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Public link not found or inactive');
    }

    // Validate expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new BadRequestException('This public link has expired');
    }

    return {
      permission: share.permission,
      file: share.file,
      folder: share.folder,
      sharedBy: share.sharedBy,
      expiresAt: share.expiresAt,
    };
  }

  async revokePublicShare(publicToken: string, userId: string) {
    const share = await this.prisma.sharedItem.findFirst({
      where: { publicToken, isPublic: true },
    });

    if (!share) {
      throw new NotFoundException('Public share not found');
    }

    if (share.sharedById !== userId) {
      throw new ForbiddenException('Only the owner can revoke this public link');
    }

    await this.prisma.sharedItem.delete({
      where: { id: share.id },
    });

    return {
      message: 'Public link revoked successfully',
    };
  }

  async getReceivedShares(userId: string, page?: number, limit?: number) {
    const where = {
      sharedWithId: userId,
      OR: [
        { file: { deletedAt: null } },
        { folder: { deletedAt: null } },
      ],
    };

    if (page && limit) {
      const pageNum = Math.max(1, page);
      const limitNum = Math.min(100, Math.max(1, limit));
      const skip = (pageNum - 1) * limitNum;

      const [total, shares] = await Promise.all([
        this.prisma.sharedItem.count({ where }),
        this.prisma.sharedItem.findMany({
          where,
          include: {
            file: true,
            folder: true,
            sharedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limitNum,
        }),
      ]);

      return {
        total,
        page: pageNum,
        limit: limitNum,
        pageSize: limitNum,
        totalPages: Math.ceil(total / limitNum),
        shares,
        items: shares,
        data: shares,
      };
    }

    return this.prisma.sharedItem.findMany({
      where,
      include: {
        file: true,
        folder: true,
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSentShares(userId: string, page?: number, limit?: number) {
    const where = {
      sharedById: userId,
      OR: [
        { file: { deletedAt: null } },
        { folder: { deletedAt: null } },
      ],
    };

    if (page && limit) {
      const pageNum = Math.max(1, page);
      const limitNum = Math.min(100, Math.max(1, limit));
      const skip = (pageNum - 1) * limitNum;

      const [total, shares] = await Promise.all([
        this.prisma.sharedItem.count({ where }),
        this.prisma.sharedItem.findMany({
          where,
          include: {
            file: true,
            folder: true,
            sharedWith: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limitNum,
        }),
      ]);

      return {
        total,
        page: pageNum,
        limit: limitNum,
        pageSize: limitNum,
        totalPages: Math.ceil(total / limitNum),
        shares,
        items: shares,
        data: shares,
      };
    }

    return this.prisma.sharedItem.findMany({
      where,
      include: {
        file: true,
        folder: true,
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateSharePermission(
    shareId: string,
    userId: string,
    updateShareDto: UpdateShareDto,
  ) {
    const share = await this.prisma.sharedItem.findFirst({
      where: {
        id: shareId,
      },
      include: {
        file: true,
        folder: true,
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found or unauthorized');
    }

    const isOwner =
      share.sharedById === userId ||
      share.file?.ownerId === userId ||
      share.folder?.ownerId === userId;

    if (!isOwner) {
      throw new ForbiddenException('Only the owner can update sharing permissions');
    }

    const updatedShare = await this.prisma.sharedItem.update({
      where: { id: shareId },
      data: {
        permission: updateShareDto.permission,
      },
      include: {
        file: true,
        folder: true,
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (this.notificationsService && updatedShare.sharedWithId) {
      try {
        const itemName = updatedShare.file?.name || updatedShare.folder?.name || 'item';
        await this.notificationsService.create({
          userId: updatedShare.sharedWithId,
          type: NotificationType.SHARE_PERMISSION_CHANGED,
          title: 'Permission updated',
          message: `Your access permission for "${itemName}" was changed to ${updatedShare.permission}`,
          relatedEntityId: updatedShare.fileId || updatedShare.folderId,
          relatedEntityType: updatedShare.fileId ? 'FILE' : 'FOLDER',
        });
      } catch {
        // Non-blocking
      }
    }

    return {
      message: 'Sharing permission updated successfully',
      share: updatedShare,
    };
  }

  async revokeShare(shareId: string, userId: string) {
    const share = await this.prisma.sharedItem.findFirst({
      where: {
        id: shareId,
      },
      include: {
        file: true,
        folder: true,
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found or unauthorized');
    }

    const isOwner =
      share.sharedById === userId ||
      share.file?.ownerId === userId ||
      share.folder?.ownerId === userId;

    if (!isOwner) {
      throw new ForbiddenException('Only the file/folder owner can revoke this share');
    }

    await this.prisma.sharedItem.delete({
      where: { id: shareId },
    });

    if (this.notificationsService && share.sharedWithId) {
      try {
        const itemName = share.file?.name || share.folder?.name || 'item';
        await this.notificationsService.create({
          userId: share.sharedWithId,
          type: NotificationType.SHARE_REVOKED,
          title: 'Share access revoked',
          message: `Access to "${itemName}" has been revoked by the owner`,
          relatedEntityId: share.fileId || share.folderId,
          relatedEntityType: share.fileId ? 'FILE' : 'FOLDER',
        });
      } catch {
        // Non-blocking
      }
    }

    return {
      message: 'Sharing revoked successfully',
      shareId,
    };
  }

  async getFileAccess(fileId: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // 1. Owner check
    if (file.ownerId === userId) {
      return {
        permission: 'OWNER',
        file,
      };
    }

    // 2. Direct file share check
    const directShare = await this.prisma.sharedItem.findFirst({
      where: {
        fileId,
        sharedWithId: userId,
      },
      include: {
        file: true,
      },
    });

    if (directShare) {
      return {
        permission: directShare.permission,
        file: directShare.file,
      };
    }

    // 3. Inherited folder share check
    if (file.folderId) {
      const folderShare = await this.prisma.sharedItem.findFirst({
        where: {
          folderId: file.folderId,
          sharedWithId: userId,
        },
      });

      if (folderShare) {
        return {
          permission: folderShare.permission,
          file,
          inheritedFromFolder: true,
        };
      }
    }

    throw new ForbiddenException('You do not have access to this file');
  }
}
