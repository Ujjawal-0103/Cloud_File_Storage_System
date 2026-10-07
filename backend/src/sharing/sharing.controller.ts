import {
  Controller,
  Param,
  Post,
  Get,
  Body,
  UseGuards,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { SharingService } from './sharing.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { CreatePublicShareDto } from './dto/create-public-share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Sharing')
@Controller('sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('files/:fileId')
  @ApiOperation({ summary: 'Share a file with another user' })
  @ApiBody({ type: CreateShareDto })
  async shareFile(
    @Param('fileId') fileId: string,
    @Body() createShareDto: CreateShareDto,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.sharingService.shareFile(fileId, user.id, createShareDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('folders/:folderId')
  @ApiOperation({ summary: 'Share a folder with another user' })
  @ApiBody({ type: CreateShareDto })
  async shareFolder(
    @Param('folderId') folderId: string,
    @Body() createShareDto: CreateShareDto,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.sharingService.shareFolder(folderId, user.id, createShareDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('public')
  @ApiOperation({ summary: 'Create an expiring or permanent public share link' })
  @ApiBody({ type: CreatePublicShareDto })
  async createPublicShare(
    @Body() createPublicShareDto: CreatePublicShareDto,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.sharingService.createPublicShare(user.id, createPublicShareDto);
  }

  // PUBLIC ACCESS: No JwtAuthGuard! Anyone with the token can access unless expired
  @Get('public/:token')
  @ApiOperation({ summary: 'Access a publicly shared file or folder by token' })
  @ApiResponse({ status: 200, description: 'Public share details' })
  @ApiResponse({ status: 400, description: 'Link expired or invalid' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async getPublicShare(@Param('token') token: string) {
    return this.sharingService.getPublicShare(token);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('public/:token')
  @ApiOperation({ summary: 'Revoke a public share link' })
  async revokePublicShare(
    @Param('token') token: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.sharingService.revokePublicShare(token, user.id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('received')
  @ApiOperation({ summary: 'Get all files and folders shared with the current user' })
  async getReceivedShares(
    @CurrentUser() user: { id: string; email: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? Number(page) : undefined;
    const limitNum = pageSize || limit ? Number(pageSize || limit) : undefined;
    return this.sharingService.getReceivedShares(user.id, pageNum, limitNum);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('sent')
  @ApiOperation({ summary: 'Get all files and folders shared by the current user' })
  async getSentShares(
    @CurrentUser() user: { id: string; email: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? Number(page) : undefined;
    const limitNum = pageSize || limit ? Number(pageSize || limit) : undefined;
    return this.sharingService.getSentShares(user.id, pageNum, limitNum);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':shareId')
  @ApiOperation({ summary: 'Update sharing permission (VIEW <-> EDIT)' })
  async updateSharePermission(
    @Param('shareId') shareId: string,
    @Body() updateShareDto: UpdateShareDto,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.sharingService.updateSharePermission(shareId, user.id, updateShareDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete(':shareId')
  @ApiOperation({ summary: 'Revoke file or folder sharing' })
  async revokeShare(
    @Param('shareId') shareId: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.sharingService.revokeShare(shareId, user.id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('files/:fileId')
  @ApiOperation({ summary: 'Check current user access permission on a file' })
  async getFileAccess(
    @Param('fileId') fileId: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.sharingService.getFileAccess(fileId, user.id);
  }
}