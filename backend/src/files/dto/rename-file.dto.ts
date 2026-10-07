import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RenameFileDto {
  @ApiProperty({ description: 'New file name', example: 'budget_final_2026.pdf' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
