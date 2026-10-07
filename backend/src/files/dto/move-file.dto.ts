import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MoveFileDto {
  @ApiPropertyOptional({
    description: 'Target folder ID or null for root directory',
    nullable: true,
    example: 'd9b2d63d-a233-40e9-8a56-42fbc923a1a1',
  })
  @IsOptional()
  @IsString()
  folderId?: string | null;
}
