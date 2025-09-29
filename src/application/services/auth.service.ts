import { Injectable, Logger, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { AuthTokenResponse, UserInfo, TokenValidationResult } from '../dtos/auth-response.dto';
import { UserRoleResponseDto } from '../dtos/role-validation.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly keycloakBaseUrl: string;
  private readonly keycloakRealm: string;
  private readonly keycloakClientId: string;
  private readonly keycloakClientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {
    this.keycloakBaseUrl = this.configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080');
    this.keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM', 'vehicle-platform');
    this.keycloakClientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID', 'auth-service');
    this.keycloakClientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET', 'your-client-secret');
  }

  async register(registerDto: RegisterDto): Promise<{ success: boolean; message: string; userId?: string }> {
    this.logger.log(`Registering user: ${registerDto.email}`);

    try {
      
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      
      const keycloakUserId = await this.createKeycloakUser(registerDto);
      
      
      const user = new User(
        registerDto.email,
        registerDto.firstName,
        registerDto.lastName,
        keycloakUserId
      );
      
      const savedUser = await this.userRepository.create(user);
      
      this.logger.log(`User registered successfully: ${savedUser.id}`);
      return {
        success: true,
        message: 'User registered successfully',
        userId: savedUser.id
      };
      
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthTokenResponse> {
    this.logger.log(`Login attempt for: ${loginDto.email}`);

    try {
      
      const tokenResponse = await this.authenticateWithKeycloak(loginDto);
      
      
      await this.syncUserFromKeycloak(tokenResponse.access_token);
      
      this.logger.log(`Login successful for: ${loginDto.email}`);
      return tokenResponse;
      
    } catch (error) {
      this.logger.error(`Login failed for ${loginDto.email}: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateToken(token: string): Promise<TokenValidationResult> {
    this.logger.log(`Starting token validation`);
    
    try {
      const userInfo = await this.introspectToken(token);
      
      if (!userInfo.active) {
        return { isValid: false, error: 'Token is not active' };
      }

      
      const user = await this.userRepository.findByKeycloakId(userInfo.sub);
      
      const userInfoResponse: UserInfo = {
        id: user?.id || userInfo.sub,
        email: userInfo.email,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        fullName: userInfo.name || '',
        isActive: user?.isActive || true,
        keycloakId: userInfo.sub,
        roles: userInfo.realm_access?.roles || []
      };

      return { isValid: true, user: userInfoResponse };
      
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      this.logger.error(`Full error details:`, error);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data:`, error.response.data);
        this.logger.error(`Response headers:`, error.response.headers);
      }
      return { isValid: false, error: error.message };
    }
  }

  async validateUserRole(token: string, requiredRole: string): Promise<UserRoleResponseDto> {
    try {
      const tokenValidation = await this.validateToken(token);
      
      if (!tokenValidation.isValid) {
        throw new UnauthorizedException('Invalid token');
      }

      const user = tokenValidation.user;
      const roles = user.roles || [];
      const hasRole = roles.includes(requiredRole);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        roles: roles,
        hasRole: hasRole
      };
      
    } catch (error) {
      this.logger.error(`Role validation failed: ${error.message}`);
      throw new UnauthorizedException('Role validation failed');
    }
  }

  async getUserInfo(token: string): Promise<UserRoleResponseDto> {
    try {
      const tokenValidation = await this.validateToken(token);
      
      if (!tokenValidation.isValid) {
        throw new UnauthorizedException('Invalid token');
      }

      const user = tokenValidation.user;
      const roles = user.roles || [];

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        roles: roles,
        hasRole: true 
      };
      
    } catch (error) {
      this.logger.error(`Get user info failed: ${error.message}`);
      throw new UnauthorizedException('Failed to get user info');
    }
  }

  async getUserById(userId: string): Promise<any> {
    try {
      this.logger.log(`Getting user by ID: ${userId}`);
      
      
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        this.logger.error(`User not found in database: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.log(`User found in database: ${user.email}`);

      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          keycloakId: user.keycloakId
        },
        roles: ['client'],
        hasRole: true
      };
      
    } catch (error) {
      this.logger.error(`Get user by ID failed: ${error.message}`);
      throw new UnauthorizedException('Failed to get user info');
    }
  }

  private async createKeycloakUser(registerDto: RegisterDto): Promise<string> {
    const adminToken = await this.getKeycloakAdminToken();
    const keycloakUrl = `${this.keycloakBaseUrl}/admin/realms/${this.keycloakRealm}/users`;

    const userData = {
      username: registerDto.email,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      enabled: true,
      credentials: [{
        type: 'password',
        value: registerDto.password,
        temporary: false
      }]
    };

    const response = await axios.post(keycloakUrl, userData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });


    const location = response.headers.location;
    const userId = location.split('/').pop();
    
    return userId;
  }

  private async authenticateWithKeycloak(loginDto: LoginDto): Promise<AuthTokenResponse> {
    const tokenUrl = `${this.keycloakBaseUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/token`;


    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: loginDto.email,
      password: loginDto.password,
      scope: 'openid profile email'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  }

  private async introspectToken(token: string): Promise<any> {
    
    const userInfoUrl = `${this.keycloakBaseUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/userinfo`;
    
    this.logger.log(`Attempting to validate token at: ${userInfoUrl}`);
    this.logger.log(`Token substring for logging: ${token.substring(0, 30)}...`);
    this.logger.log(`DEBUG: Starting introspectToken with roles support`);
    
    const response = await axios.get(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    this.logger.log(`Token validation successful`);
    this.logger.log(`DEBUG: About to get admin token and user roles`);
    
    
    const adminToken = await this.getKeycloakAdminToken();
    const userRoles = await this.getUserRoles(response.data.sub, adminToken);
    
    
    const userInfo = response.data;
    return {
      active: true,
      sub: userInfo.sub,
      email: userInfo.email,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      name: userInfo.name,
      preferred_username: userInfo.preferred_username,
      realm_access: { roles: userRoles }
    };
  }

  private async getUserRoles(userId: string, adminToken: string): Promise<string[]> {
    try {
      this.logger.log(`Getting roles for user: ${userId}`);
      const rolesUrl = `${this.keycloakBaseUrl}/admin/realms/${this.keycloakRealm}/users/${userId}/role-mappings/realm`;
      
      this.logger.log(`Making request to: ${rolesUrl}`);
      const response = await axios.get(rolesUrl, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      this.logger.log(`Keycloak returned roles: ${JSON.stringify(response.data)}`);

      
      const roles = response.data.map((role: any) => role.name).filter((name: string) => 
      
        !name.startsWith('default-roles-') && 
        name !== 'uma_authorization' && 
        name !== 'offline_access'
      );

      this.logger.log(`Filtered roles for user ${userId}: ${roles.join(', ')}`);
      return roles;
      
    } catch (error) {
      this.logger.error(`Failed to get user roles: ${error.message}`);
      this.logger.error(`Error details: ${JSON.stringify(error.response?.data || error)}`);
      return []; 
    }
  }

  private async getKeycloakAdminToken(): Promise<string> {
    const tokenUrl = `${this.keycloakBaseUrl}/realms/master/protocol/openid-connect/token`;

    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: this.configService.get('KEYCLOAK_ADMIN_USER', 'admin'),
      password: this.configService.get('KEYCLOAK_ADMIN_PASSWORD', 'admin')
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data.access_token;
  }

  private async syncUserFromKeycloak(accessToken: string): Promise<void> {
    try {
      const userInfoUrl = `${this.keycloakBaseUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/userinfo`;
      
      const response = await axios.get(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const keycloakUser = response.data;
      let user = await this.userRepository.findByKeycloakId(keycloakUser.sub);
      
      if (!user) {
 
        user = new User(
          keycloakUser.email,
          keycloakUser.given_name || '',
          keycloakUser.family_name || '',
          keycloakUser.sub
        );
        await this.userRepository.create(user);
      }
    } catch (error) {
      this.logger.warn(`Failed to sync user from Keycloak: ${error.message}`);
    }
  }
}