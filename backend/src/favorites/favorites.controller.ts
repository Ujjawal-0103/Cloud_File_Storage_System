import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { FavoritesService } from './favorites.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Favorites')
@ApiBearerAuth('access-token')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
  ) {}

  @Post(':fileId')
  async addFavorite(
    @Param('fileId') fileId: string,

    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.favoritesService.addFavorite(
      user.id,
      fileId,
    );
  }

  @Get()
  async getFavorites(
    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.favoritesService.getFavorites(
      user.id,
    );
  }

  @Delete(':fileId')
  async removeFavorite(
    @Param('fileId') fileId: string,

    @CurrentUser()
    user: {
      id: string;
      email: string;
    },
  ) {
    return this.favoritesService.removeFavorite(
      user.id,
      fileId,
    );
  }
}