import type { CurrentUser } from '../types/auth';
import type { MenuItem } from '../config/menu';

export function hasPermission(user: CurrentUser | null, permissionKey: string) {
  return Boolean(user?.permissions?.includes(permissionKey));
}

export function hasAnyPermission(user: CurrentUser | null, permissionKeys: string[] = []) {
  if (permissionKeys.length === 0) return true;
  return permissionKeys.some((permissionKey) => hasPermission(user, permissionKey));
}

export function hasRole(user: CurrentUser | null, roleKey: string) {
  return Boolean(user?.roles?.includes(roleKey));
}

export function isAdminLike(user: CurrentUser | null) {
  return Boolean(user?.userType === 'system' || hasRole(user, 'admin') || hasRole(user, 'system'));
}

export function canShowMenuItem(user: CurrentUser | null, menuItem: MenuItem) {
  if (menuItem.key === 'dashboard') return true;
  if (isAdminLike(user)) return true;
  if (menuItem.requiredRoles?.length && !menuItem.requiredRoles.some((roleKey) => hasRole(user, roleKey))) {
    return false;
  }
  return hasAnyPermission(user, menuItem.requiredPermissions);
}
