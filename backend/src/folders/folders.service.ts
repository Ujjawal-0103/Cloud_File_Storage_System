import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createFolderDto: CreateFolderDto,
  ) {
    if (createFolderDto.parentId) {
      const parentFolder = await this.prisma.folder.findFirst({
        where: {
          id: createFolderDto.parentId,
          ownerId: userId,
        },
      });

      if (!parentFolder) {
        throw new NotFoundException(
          'Parent folder not found',
        );
      }
    }

    return this.prisma.folder.create({
      data: {
        name: createFolderDto.name,
        ownerId: userId,
        parentId: createFolderDto.parentId,
      },
    });
  }


  async findAll(userId: string) {
    return this.prisma.folder.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async update(
    userId: string,
    folderId: string,
    updateFolderDto: UpdateFolderDto,
  ) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (updateFolderDto.parentId) {
      // A folder cannot be its own parent
      if (updateFolderDto.parentId === folderId) {
        throw new BadRequestException(
          'A folder cannot be its own parent',
        );
      }

      // Parent must belong to the same user
      const parentFolder = await this.prisma.folder.findFirst({
        where: {
          id: updateFolderDto.parentId,
          ownerId: userId,
        },
      });

      if (!parentFolder) {
        throw new NotFoundException(
          'Parent folder not found',
        );
      }

      // Check whether the selected parent is a descendant
      let currentParentId = parentFolder.parentId;

      while (currentParentId) {
        if (currentParentId === folderId) {
          throw new BadRequestException(
            'Cannot move a folder inside one of its descendants',
          );
        }

        const currentParent = await this.prisma.folder.findUnique({
          where: {
            id: currentParentId,
          },
          select: {
            parentId: true,
          },
        });

        if (!currentParent) {
          break;
        }

        currentParentId = currentParent.parentId;
      }
    }

    return this.prisma.folder.update({
      where: {
        id: folderId,
      },
      data: updateFolderDto,
    });
  }

  async remove(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return this.prisma.folder.delete({
      where: {
        id: folderId,
      },
    });
  }

  async getTree(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const folderMap = new Map<string, any>();

    for (const folder of folders) {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
      });
    }

    const tree: any[] = [];

    for (const folder of folders) {
      const currentFolder = folderMap.get(folder.id);

      if (folder.parentId) {
        const parentFolder = folderMap.get(folder.parentId);

        if (parentFolder) {
          parentFolder.children.push(currentFolder);
        }
      } else {
        tree.push(currentFolder);
      }
    }

    return tree;
  }


}