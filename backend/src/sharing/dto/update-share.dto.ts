import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { Permission } from '@prisma/client';

export class UpdateShareDto {
  @ApiProperty({
    enum: Permission,
    example: Permission.EDIT,
    description: 'New access permission (VIEW or EDIT)',
  })
  @IsEnum(Permission)
  permission!: Permission;
}