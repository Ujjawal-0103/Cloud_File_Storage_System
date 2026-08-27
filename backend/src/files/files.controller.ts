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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { FilesService } from './files.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Files')
@ApiBearerAuth('access-token')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
  ) {}

  // =========================
  // GET ALL FILES
  // =========================

  @Get()
  @UseGuards(JwtAuthGuard)

  @ApiQuery({
    name: 'folderId',
    required: false,
    type: String,
    description: 'Filter files by folder ID',
  })

  @ApiQuery({
    name: 'mimeType',
    required: false,
    type: String,
    description: 'Filter files by MIME type, e.g. pdf or image',
  })

  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'size', 'createdAt', 'updatedAt'],
    description: 'Field used for sorting',
  })

  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sorting direction',
  })

  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })

  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of files per page',
  })

  async getFiles(
    @Query('folderId') folderId?: string,

    @Query('mimeType') mimeType?: string,

    @Query('sortBy')
    sortBy:
      | 'name'
      | 'size'
      | 'createdAt'
      | 'updatedAt' = 'createdAt',

    @Query('order')
    order: 'asc' | 'desc' = 'desc',

    @Query('page') page = '1',

    @Query('limit') limit = '20',

    @CurrentUser()
    user?: {
      id: string;
      email: string;
    },
  ) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // Validate page
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1
    ) {
      throw new BadRequestException(
        'page must be a positive integer',
      );
    }

    // Validate limit
    if (
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      throw new BadRequestException(
        'limit must be between 1 and 100',
      );
    }

    // Validate sort field
    const allowedSortFields = [
      'name',
      'size',
      'createdAt',
      'updatedAt',
    ];

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(
        'Invalid sortBy value',
      );
    }

    // Validate sort order
    if (order !== 'asc' && order !== 'desc') {
      throw new BadRequestException(
        'order must be asc or desc',
      );
    }

    return this.filesService.findAll(
      user!.id,
      folderId,
      mimeType,
      sortBy,
      order,
      pageNumber,
      limitNumber,
    );
  }

@Get('recent')
@UseGuards(JwtAuthGuard)
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  example: 10,
  description: 'Number of recent files to return',
})

async getRecentFiles(
  @Query('limit') limit = '10',

  @CurrentUser()
  user: {
    id: string;
    email: string;
  },
  ) {
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      throw new BadRequestException(
        'limit must be between 1 and 100',
      );
    }

    return this.filesService.getRecentFiles(
      user.id,
      limitNumber,
    );
  }

@Get('storage')
@UseGuards(JwtAuthGuard)
async getStorageUsage(
  @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.filesService.getStorageUsage(
      user.id,
    );
  }

  // =========================
  // UPLOAD FILE
  // =========================

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
          description:
            'Optional ID of the folder to upload the file into',
        },
      },

      required: ['file'],
    },
  })

  async uploadFile(
    @UploadedFile() file: any,

    @CurrentUser()
    user: {
      id: string;
      email: string;
    },

    @Body('folderId') folderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file received. Make sure the form field is named "file".',
      );
    }

    return this.filesService.uploadFile(
      file,
      user.id,
      folderId,
    );
  }

  // =========================
  // DELETE FILE
  // =========================

  @Delete(':id')
  @UseGuards(JwtAuthGuard)

  async deleteFile(
    @Param('id') id: string,

    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.filesService.deleteFile(
      id,
      user.id,
    );
  }
}