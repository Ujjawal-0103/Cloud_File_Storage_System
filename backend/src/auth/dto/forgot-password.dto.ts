import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Registered user email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty()
  email!: string;
}
