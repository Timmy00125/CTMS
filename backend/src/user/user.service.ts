import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';
import * as argon2 from 'argon2';

export interface CreateUserDto {
  email: string;
  password?: string;
  name: string;
  roles?: Role[];
  departmentId?: string;
}

export interface UpdateUserDto {
  name?: string;
  roles?: Role[];
  departmentId?: string | null;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const { email, password, name, roles, departmentId } = data;
    const passwordHash = password ? await argon2.hash(password) : '';

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          roles: roles ?? [Role.Lecturer],
          departmentId,
        },
      });
      this.logger.log(`User created: ${user.id} (${user.email})`);
      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ passwordHash, ...user }) => user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async updateRoles(
    id: string,
    roles: Role[],
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roles },
    });

    this.logger.log(`User roles updated: ${id} -> [${roles.join(', ')}]`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = updated;
    return result;
  }

  async update(
    id: string,
    data: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    this.logger.log(`User updated: ${id}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = updated;
    return result;
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: '' },
    });

    this.logger.log(`User deactivated: ${id}`);
  }
}
