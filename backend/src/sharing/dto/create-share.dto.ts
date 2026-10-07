import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

import { Permission } from '@prisma/client';

export class CreateShareDto {
  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'User ID of recipient (provide either sharedWithId or email)',
  })
  @IsOptional()
  @IsUUID()
  sharedWithId?: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email of recipient (provide either email or sharedWithId)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    enum: Permission,
    example: Permission.VIEW,
    description: 'Access permission granted (VIEW or EDIT)',
  })
  @IsEnum(Permission)
  permission!: Permission;
}