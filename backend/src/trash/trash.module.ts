import { Module } from '@nestjs/common';

import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';

import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
  ],
  controllers: [TrashController],
  providers: [TrashService],
})
export class TrashModule {}