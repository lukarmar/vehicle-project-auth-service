import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@application/services/auth.service';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/entities/user.entity';
import { RegisterDto } from '@application/dtos/register.dto';
import { LoginDto } from '@application/dtos/login.dto';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockUserRepo = {
      findByEmail: jest.fn(),
      findByKeycloakId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UserRepository',
          useValue: mockUserRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    })
    .setLogger(mockLogger)
    .compile();

    authService = module.get<AuthService>(AuthService);
    mockUserRepository = module.get('UserRepository');
    mockConfigService = module.get(ConfigService);

    mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
      const config = {
        'KEYCLOAK_URL': 'http://localhost:8080',
        'KEYCLOAK_REALM': 'vehicle-platform',
        'KEYCLOAK_CLIENT_ID': 'auth-service',
        'KEYCLOAK_CLIENT_SECRET': 'test-secret',
        'KEYCLOAK_ADMIN_USER': 'admin',
        'KEYCLOAK_ADMIN_PASSWORD': 'admin',
      };
      return config[key] || defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const keycloakUserId = 'keycloak-123';
      const savedUser = new User(registerDto.email, registerDto.firstName, registerDto.lastName, keycloakUserId);

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(savedUser);

      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'admin-token' }
      });

      mockedAxios.post.mockResolvedValueOnce({
        headers: { location: `http://localhost:8080/admin/realms/vehicle-platform/users/${keycloakUserId}` }
      });

      const result = await authService.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.userId).toBe(savedUser.id);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.any(User));
    });

    it('should throw BadRequestException when user already exists', async () => {
      const existingUser = new User(registerDto.email, 'Existing', 'User');
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Keycloak user creation fails', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'admin-token' }
      });

      mockedAxios.post.mockRejectedValueOnce(new Error('Keycloak error'));

      await expect(authService.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully', async () => {
      const tokenResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const userInfoResponse = {
        sub: 'keycloak-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: tokenResponse });
      
      mockedAxios.get.mockResolvedValueOnce({ data: userInfoResponse });

      mockUserRepository.findByKeycloakId.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(new User(userInfoResponse.email, userInfoResponse.given_name, userInfoResponse.family_name, userInfoResponse.sub));

      const result = await authService.login(loginDto);

      expect(result).toEqual(tokenResponse);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    const token = 'test-token';

    it('should validate token successfully', async () => {
      const userInfoResponse = {
        sub: 'keycloak-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
      };

      const adminTokenResponse = {
        access_token: 'admin-token',
        token_type: 'Bearer'
      };

      const rolesResponse = [
        { name: 'user' },
        { name: 'default-roles-vehicle-platform' }
      ];

      const user = new User('test@example.com', 'John', 'Doe', 'keycloak-123');

      
      mockedAxios.get.mockResolvedValueOnce({ data: userInfoResponse });
      mockedAxios.post.mockResolvedValueOnce({ data: adminTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: rolesResponse });
      mockUserRepository.findByKeycloakId.mockResolvedValue(user);

      const result = await authService.validateToken(token);

      expect(result.isValid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userInfoResponse.email);
      expect(result.user.roles).toEqual(['user']);
    });

    it('should return invalid when token is not active', async () => {
      
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'invalid_token' }
        },
        message: 'Request failed with status code 401'
      });

      const result = await authService.validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Request failed with status code 401');
    });

    it('should return invalid when introspection fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Introspection failed'));

      const result = await authService.validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Introspection failed');
    });
  });

  describe('validateUserRole', () => {
    const token = 'test-token';
    const requiredRole = 'admin';

    it('should validate user role successfully when user has required role', async () => {
      const userInfoResponse = {
        sub: 'keycloak-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
      };

      const adminTokenResponse = {
        access_token: 'admin-token',
        token_type: 'Bearer'
      };

      const rolesResponse = [
        { name: 'user' },
        { name: 'admin' },
        { name: 'default-roles-vehicle-platform' }
      ];

      const user = new User('test@example.com', 'John', 'Doe', 'keycloak-123');

      
      mockedAxios.get.mockResolvedValueOnce({ data: userInfoResponse });
      mockedAxios.post.mockResolvedValueOnce({ data: adminTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: rolesResponse });
      
      mockUserRepository.findByKeycloakId.mockResolvedValue(user);

      const result = await authService.validateUserRole(token, requiredRole);

      expect(result.hasRole).toBe(true);
      expect(result.roles).toEqual(['user', 'admin']);
      expect(result.user.email).toBe('test@example.com');
    });

    it('should return false when user does not have required role', async () => {
      const userInfoResponse = {
        sub: 'keycloak-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
      };

      const adminTokenResponse = {
        access_token: 'admin-token',
        token_type: 'Bearer'
      };

      const rolesResponse = [
        { name: 'user' },
        { name: 'default-roles-vehicle-platform' }
      ];

      const user = new User('test@example.com', 'John', 'Doe', 'keycloak-123');

      
      mockedAxios.get.mockResolvedValueOnce({ data: userInfoResponse });
      mockedAxios.post.mockResolvedValueOnce({ data: adminTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: rolesResponse });
      mockUserRepository.findByKeycloakId.mockResolvedValue(user);

      const result = await authService.validateUserRole(token, requiredRole);

      expect(result.hasRole).toBe(false);
      expect(result.roles).toEqual(['user']);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Token validation failed'));

      await expect(authService.validateUserRole(token, requiredRole)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserInfo', () => {
    const token = 'test-token';

    it('should get user info successfully', async () => {
      const userInfoResponse = {
        sub: 'keycloak-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
      };

      const adminTokenResponse = {
        access_token: 'admin-token',
        token_type: 'Bearer'
      };

      const rolesResponse = [
        { name: 'user' },
        { name: 'default-roles-vehicle-platform' }
      ];

      const user = new User('test@example.com', 'John', 'Doe', 'keycloak-123');

      
      mockedAxios.get.mockResolvedValueOnce({ data: userInfoResponse });
      mockedAxios.post.mockResolvedValueOnce({ data: adminTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: rolesResponse });
      
      mockUserRepository.findByKeycloakId.mockResolvedValue(user);

      const result = await authService.getUserInfo(token);

      expect(result.user.email).toBe('test@example.com');
      expect(result.roles).toEqual(['user']);
      expect(result.hasRole).toBe(true);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Token validation failed'));

      await expect(authService.validateUserRole(token, 'admin')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserInfo', () => {
    const token = 'test-token';

    it('should get user info successfully', async () => {
      const userInfoResponse = {
        sub: 'keycloak-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
      };

      const adminTokenResponse = {
        access_token: 'admin-token',
        token_type: 'Bearer'
      };

      const rolesResponse = [
        { name: 'user' },
        { name: 'default-roles-vehicle-platform' }
      ];

      const user = new User('test@example.com', 'John', 'Doe', 'keycloak-123');

      
      mockedAxios.get.mockResolvedValueOnce({ data: userInfoResponse });
      mockedAxios.post.mockResolvedValueOnce({ data: adminTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: rolesResponse });
      
      mockUserRepository.findByKeycloakId.mockResolvedValue(user);

      const result = await authService.getUserInfo(token);

      expect(result.user.email).toBe('test@example.com');
      expect(result.roles).toEqual(['user']);
      expect(result.hasRole).toBe(true);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Token validation failed'));

      await expect(authService.getUserInfo(token)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('private methods integration', () => {
    it('should handle syncUserFromKeycloak when user does not exist', async () => {
      const accessToken = 'access-token';
      const userInfoResponse = {
        sub: 'keycloak-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: userInfoResponse });
      mockUserRepository.findByKeycloakId.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(new User(userInfoResponse.email, userInfoResponse.given_name, userInfoResponse.family_name, userInfoResponse.sub));

      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { 
          access_token: accessToken,
          refresh_token: 'refresh-token',
          token_type: 'Bearer',
          expires_in: 3600
        } 
      });

      await authService.login(loginDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.any(User));
    });

    it('should handle errors in syncUserFromKeycloak gracefully', async () => {
      const accessToken = 'access-token';
      
      mockedAxios.get.mockRejectedValueOnce(new Error('Keycloak userinfo failed'));

      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { 
          access_token: accessToken,
          refresh_token: 'refresh-token',
          token_type: 'Bearer',
          expires_in: 3600
        } 
      });

      const result = await authService.login(loginDto);
      expect(result).toBeDefined();
    });
  });
});