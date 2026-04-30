import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, AuthLoginResult } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let authService: AuthService;

  const mockUserService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return the user without password if validation succeeds', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        passwordHash: 'hashed_pw',
        name: 'Test',
        roles: ['Admin'],
        departmentId: 'dep-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserService.findByEmail.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('test@test.com', 'pass123');

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(argon2.verify).toHaveBeenCalledWith('hashed_pw', 'pass123');
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        departmentId: user.departmentId,
      });
    });

    it('should return null if user is not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser(
        'nonexistent@test.com',
        'pass',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is wrong', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        passwordHash: 'hashed_pw',
      };
      mockUserService.findByEmail.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('test@test.com', 'wrong');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user: AuthLoginResult = {
        id: '1',
        email: 'test@test.com',
        roles: [],
        departmentId: null,
        name: 'Test User',
      };

      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      const result = await authService.login(user);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'access_token_mock',
        refreshToken: 'refresh_token_mock',
      });
    });
  });
});
