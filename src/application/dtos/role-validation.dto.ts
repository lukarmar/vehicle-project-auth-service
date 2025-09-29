import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateRoleDto {
  @ApiProperty({
    description: 'Required role to validate',
    example: 'admin',
  })
  @IsString()
  requiredRole: string;
}

export class UserRoleResponseDto {
  @ApiProperty({
    description: 'User information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  @ApiProperty({
    description: 'User roles',
    example: ['client', 'admin'],
  })
  @IsArray()
  roles: string[];

  @ApiProperty({
    description: 'Whether user has the required role',
    example: true,
  })
  hasRole: boolean;
}