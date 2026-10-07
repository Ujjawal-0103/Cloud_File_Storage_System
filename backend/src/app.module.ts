import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FoldersModule } from './folders/folders.module';
import { FilesModule } from './files/files.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { SearchModule } from './search/search.module';
import { FavoritesModule } from './favorites/favorites.module';
import { TrashModule } from './trash/trash.module';
import { SharingModule } from './sharing/sharing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CacheModule } from './common/cache/cache.module';
import { NotificationsModule } from './notifications/notifications.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      errorMessage: 'Too many requests, please try again later.',
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 120, // Baseline: 120 req/min for general app operations
        },
        {
          name: 'auth',
          ttl: 60000,
          limit: 20, // Stricter: 20 req/min for authentication
        },
      ],
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    FoldersModule,
    FilesModule,
    CloudinaryModule,
    SearchModule,
    FavoritesModule,
    TrashModule,
    SharingModule,
    DashboardModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}