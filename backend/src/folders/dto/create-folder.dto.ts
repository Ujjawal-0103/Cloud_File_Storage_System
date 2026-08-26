import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({
    example: 'Documents',
    description: 'Name of the folder',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: '2f8f8d7b-9d2d-45d5-b1d3-44d61d43e5d8',
    description: 'Parent folder ID (optional)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}