import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Enforces granular admin permissions. Runs AFTER RolesGuard (global order).
 * - No @Permissions on the route → allow (does not interfere with public/owner/provider routes).
 * - role 'admin' → allow (superuser).
 * - role 'staff' → must hold ALL required permissions (from app_metadata.permissions).
 * - any other role → deny.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = ctx.switchToHttp().getRequest().user;
    if (!user) return false;

    const role = user.app_metadata?.role ?? user.role ?? user.user_metadata?.role;
    if (role === 'admin') return true;
    if (role !== 'staff') throw new ForbiddenException('Insufficient permissions');

    const granted: string[] = (user.app_metadata?.permissions as string[]) ?? [];
    if (!required.every((p) => granted.includes(p))) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
