import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User, Role } from '@prisma/client';

export type AuthLoginResult = Omit<
  User,
  'passwordHash' | 'createdAt' | 'updatedAt'
>;

export interface TokenPayload {
  sub: string;
  email: string;
  roles: Role[];
  departmentId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<AuthLoginResult | null> {
    const user = await this.userService.findByEmail(email);
    if (user && (await argon2.verify(user.passwordHash, pass))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, createdAt, updatedAt, ...result } = user;
      return result;
    }
    return null;
  }

  async login(
    user: AuthLoginResult,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      departmentId: user.departmentId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException();
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, createdAt, updatedAt, ...result } = user;
      return this.login(result);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
