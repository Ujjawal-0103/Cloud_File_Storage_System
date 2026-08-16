import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    CloudinaryModule,
    PrismaModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}