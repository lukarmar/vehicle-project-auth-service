import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AuthService } from '@application/services/auth.service';
import { LoginDto } from '@application/dtos/login.dto';
import { RegisterDto } from '@application/dtos/register.dto';
import { Public } from '../decorators/public.decorator';

@ApiTags('External Auth API')
@Controller('api/v1/auth')
export class ExternalAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate JWT token - Used by other services' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        token: { type: 'string', description: 'JWT token to validate' } 
      },
      required: ['token']
    } 
  })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async validateToken(@Body('token') token: string): Promise<any> {
    console.log(`ExternalAuth: Received token validation request with token: ${token?.substring(0, 30)}...`);
    const result = await this.authService.validateToken(token);
    console.log(`ExternalAuth: Validation result:`, result);
    return result;
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get user information by ID - Used by other services' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User information' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserInfo(@Param('id') userId: string): Promise<any> {
    return this.authService.getUserById(userId);
  }

  @Get('test/:id')
  @ApiOperation({ summary: 'Test endpoint to get user - simple version' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User information' })
  async testGetUser(@Param('id') userId: string): Promise<any> {
    return { message: `Testing user: ${userId}`, status: 'success' };
  }

  @Post('test-post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test POST endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testPost(): Promise<any> {
    return { message: 'Test POST works', status: 'success' };
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with credentials' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async authenticate(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  async register(@Body() registerDto: RegisterDto): Promise<any> {
    return this.authService.register(registerDto);
  }
}