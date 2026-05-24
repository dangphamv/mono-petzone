import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Roles } from './roles.decorator';

export const PERMISSIONS_KEY = 'permissions';

/** Require the given admin permission(s) on a route. Enforced by PermissionsGuard. */
export const Permissions = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);

/**
 * Opt-in staff access on an admin endpoint: allows roles admin+staff AND requires the
 * given permission(s). Admin is a superuser (PermissionsGuard bypasses the check for them).
 * Methods WITHOUT @StaffAccess inherit the controller's class-level @Roles('admin') → admin-only.
 */
export const StaffAccess = (...perms: string[]) =>
  applyDecorators(Roles('admin', 'staff'), Permissions(...perms));
