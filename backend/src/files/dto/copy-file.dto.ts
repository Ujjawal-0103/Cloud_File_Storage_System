import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CopyFileDto {
  @ApiPropertyOptional({
    description: 'Target folder ID for the copy, or omit to copy into same folder',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  folderId?: string | null;
}
