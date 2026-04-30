import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TokenPayload } from '../auth.service';

export interface RequestWithTenant {
  user?: TokenPayload;
  params?: { departmentId?: string };
  body?: { departmentId?: string };
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = request.user;

    if (!user) {
      return false;
    }

    const resourceDepartmentId =
      request.params?.departmentId || request.body?.departmentId;

    if (!resourceDepartmentId) {
      return true; // Not a tenant-scoped route
    }

    if (user.roles?.includes(Role.Admin)) {
      return true; // Admin bypasses tenant check
    }

    if (user.departmentId !== resourceDepartmentId) {
      throw new ForbiddenException(
        "You do not have access to this department's resources",
      );
    }

    return true;
  }
}
