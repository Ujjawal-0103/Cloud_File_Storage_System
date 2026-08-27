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
}