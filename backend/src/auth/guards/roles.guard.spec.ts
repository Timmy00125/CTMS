import { RolesGuard } from './roles.guard.js';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TokenPayload } from '../auth.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: TokenPayload | null): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({} as TokenPayload);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false if user does not exist', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    const context = createMockContext(null);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return true if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    const context = createMockContext({ roles: [Role.Admin] } as TokenPayload);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user has at least one of the required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.Admin, Role.ExamOfficer]);
    const context = createMockContext({
      roles: [Role.ExamOfficer],
    } as TokenPayload);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false if user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    const context = createMockContext({
      roles: [Role.Lecturer],
    } as TokenPayload);

    expect(guard.canActivate(context)).toBe(false);
  });
});
