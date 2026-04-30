import { Test, TestingModule } from '@nestjs/testing';
import { UserService, CreateUserDto } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

jest.mock('argon2');

const mockPrismaService = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should hash the password and create a user', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const hashedPassword = 'hashed_password_mock';
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const createdUser = {
        id: 'user-id',
        email: dto.email,
        name: dto.name,
        passwordHash: hashedPassword,
        roles: [],
        departmentId: null,
      };

      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.createUser(dto);

      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash: hashedPassword,
        },
      });
      expect(result).toEqual(createdUser);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const email = 'test@example.com';
      const user = { id: 'user-id', email };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(user);
    });

    it('should return null if not found', async () => {
      const email = 'notfound@example.com';
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });
});
