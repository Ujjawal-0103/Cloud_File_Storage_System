import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateFolderDto } from './dto/update-folder.dto';

@ApiTags('Folders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() createFolderDto: CreateFolderDto,
  ) {
    return this.foldersService.create(
      user.id,
      createFolderDto,
    );
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.foldersService.findAll(user.id);
  }

  @Get('tree')
  getTree(@CurrentUser() user: { id: string }) {
    return this.foldersService.getTree(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') folderId: string,
    @CurrentUser() user: { id: string },
    ) {
    return this.foldersService.findOne(
        user.id,
        folderId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') folderId: string,
    @CurrentUser() user: { id: string },
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.foldersService.update(
      user.id,
      folderId,
      updateFolderDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') folderId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.foldersService.remove(
      user.id,
      folderId,
    );
  }


}