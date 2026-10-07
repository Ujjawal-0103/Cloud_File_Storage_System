import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('search')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser() user: any,
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const pageNum = page ? Number(page) : undefined;
    const limitNum = pageSize || limit ? Number(pageSize || limit) : undefined;

    if (pageNum !== undefined || limitNum !== undefined) {
      return this.searchService.search(
        user.id,
        query.trim(),
        pageNum,
        limitNum,
      );
    }

    return this.searchService.search(
      user.id,
      query.trim(),
    );
  }
}