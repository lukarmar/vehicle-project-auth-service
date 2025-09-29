import { IsEmail, IsString, MinLength, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John'
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe'
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+5511999999999',
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'User date of birth',
    example: '1990-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}