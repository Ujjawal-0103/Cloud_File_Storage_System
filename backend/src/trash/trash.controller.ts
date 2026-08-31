import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { TrashService } from './trash.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Trash')
@ApiBearerAuth('access-token')
@Controller('trash')
@UseGuards(JwtAuthGuard)
export class TrashController {
  constructor(
    private readonly trashService: TrashService,
  ) {}

  @Get()
  async getTrash(
    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.trashService.getTrash(user.id);
  }

  @Patch(':fileId/restore')
  async restoreFile(
    @Param('fileId') fileId: string,

    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.trashService.restoreFile(
      fileId,
      user.id,
    );
  }

  @Delete(':fileId/permanent')
  async permanentlyDeleteFile(
    @Param('fileId') fileId: string,

    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.trashService.permanentlyDeleteFile(
      fileId,
      user.id,
    );
  }

  @Delete(':fileId')
  async deleteFile(
    @Param('fileId') fileId: string,

    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.trashService.permanentlyDeleteFile(
      fileId,
      user.id,
    );
  }

  @Patch('folders/:folderId/restore')
  async restoreFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.trashService.restoreFolder(
      folderId,
      user.id,
    );
  }

  @Delete('folders/:folderId/permanent')
  async permanentlyDeleteFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.trashService.permanentlyDeleteFolder(
      folderId,
      user.id,
    );
  }

  @Delete('folders/:folderId')
  async deleteFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.trashService.permanentlyDeleteFolder(
      folderId,
      user.id,
    );
  }
}