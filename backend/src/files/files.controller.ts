import {
  BadRequestException,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';

import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getFiles(
    @Query('folderId') folderId?: string,
    @CurrentUser() user?: { id: string; email: string },
  ) {
    return this.filesService.findAll(folderId, user?.id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folderId: {
          type: 'string',
          description: 'Optional ID of the folder to upload the file into',
        },
      },
      required: ['file'],
    },
  })
  async uploadFile(
    @UploadedFile() file: any,
    @CurrentUser() user: { id: string; email: string },
    @Body('folderId') folderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file received. Make sure the form field is named "file".',
      );
    }

    return this.filesService.uploadFile(file, user.id, folderId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.filesService.deleteFile(id, user.id);
  }
}