import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { Permission } from '@prisma/client';

export class CreatePublicShareDto {
  @ApiPropertyOptional({ description: 'File ID to share publicly' })
  @IsOptional()
  @IsString()
  fileId?: string;

  @ApiPropertyOptional({ description: 'Folder ID to share publicly' })
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiPropertyOptional({ enum: Permission, default: Permission.VIEW })
  @IsOptional()
  @IsEnum(Permission)
  permission?: Permission;

  @ApiPropertyOptional({ description: 'Optional expiration timestamp in ISO format' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Optional expiration in hours' })
  @IsOptional()
  @IsNumber()
  expiresInHours?: number;
}
