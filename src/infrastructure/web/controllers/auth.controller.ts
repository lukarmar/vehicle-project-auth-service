import { Controller, Post, Body, Get, Headers, HttpStatus, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthService } from '@application/services/auth.service';
import { RegisterDto } from '@application/dtos/register.dto';
import { LoginDto } from '@application/dtos/login.dto';
import { UserRoleResponseDto } from '@application/dtos/role-validation.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register new user',
    description: 'Create a new user account in Keycloak and local database' 
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: 'User registered successfully',
        userId: 'uuid-here'
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data or user already exists' })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user with Keycloak and return JWT tokens' 
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer'
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    return await this.authService.login(loginDto);
  }

  @Post('validate')
  @ApiOperation({ 
    summary: 'Validate JWT token',
    description: 'Validate if a JWT token is active and get user information' 
  })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token validation result',
    schema: {
      example: {
        isValid: true,
        user: {
          id: 'user-id',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          isActive: true,
          roles: ['buyer']
        }
      }
    }
  })
  async validateToken(@Headers('authorization') authHeader: string) {
    this.logger.log(`Received validate token request with header: ${authHeader?.substring(0, 30)}...`);
    
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      this.logger.log('No token provided in request');
      return { isValid: false, error: 'No token provided' };
    }
    
    this.logger.log(`Calling authService.validateToken with token: ${token.substring(0, 30)}...`);
    
    return await this.authService.validateToken(token);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for auth service' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'OK',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    };
  }

  @Post('validate-role')
  @ApiOperation({ 
    summary: 'Validate user role',
    description: 'Check if user has the required role' 
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'role', description: 'Required role to validate', example: 'admin' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Role validation result',
    type: UserRoleResponseDto
  })
  async validateRole(
    @Headers('authorization') authHeader: string,
    @Query('role') requiredRole: string
  ): Promise<UserRoleResponseDto> {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    
    return await this.authService.validateUserRole(token, requiredRole);
  }

  @Get('user-info')
  @ApiOperation({ 
    summary: 'Get user information',
    description: 'Get user details and roles from JWT token' 
  })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User information',
    type: UserRoleResponseDto
  })
  async getUserInfo(@Headers('authorization') authHeader: string): Promise<UserRoleResponseDto> {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    
    return await this.authService.getUserInfo(token);
  }
}