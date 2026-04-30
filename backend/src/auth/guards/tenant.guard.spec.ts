import { TenantGuard } from './tenant.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TokenPayload } from '../auth.service';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  const createMockContext = (
    user: TokenPayload | null,
    params: { departmentId?: string } = {},
    body: { departmentId?: string } = {},
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          body,
        }),
      }),
    }) as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no departmentId is in the request (not a tenant-scoped route)', () => {
    const context = createMockContext({
      departmentId: 'dep-1',
    } as TokenPayload);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user is Admin, regardless of departmentId', () => {
    const context = createMockContext(
      { roles: [Role.Admin], departmentId: 'dep-1' } as TokenPayload,
      { departmentId: 'dep-2' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user departmentId matches route params departmentId', () => {
    const context = createMockContext(
      { roles: [Role.Lecturer], departmentId: 'dep-1' } as TokenPayload,
      { departmentId: 'dep-1' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user departmentId matches request body departmentId', () => {
    const context = createMockContext(
      { roles: [Role.Lecturer], departmentId: 'dep-1' } as TokenPayload,
      {},
      { departmentId: 'dep-1' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user departmentId does not match resource departmentId', () => {
    const context = createMockContext(
      { roles: [Role.Lecturer], departmentId: 'dep-1' } as TokenPayload,
      { departmentId: 'dep-2' },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no departmentId but resource requires one', () => {
    const context = createMockContext(
      { roles: [Role.Lecturer], departmentId: null } as TokenPayload,
      { departmentId: 'dep-1' },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should return false if user does not exist', () => {
    const context = createMockContext(null, { departmentId: 'dep-1' });
    expect(guard.canActivate(context)).toBe(false);
  });
});
