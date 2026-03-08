/**
 * Permission checking utilities
 */

export interface UserWithPermissions {
  id: string | number;
  email: string;
  full_name: string;
  role_name: string;
  permissions?: string[];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: UserWithPermissions | null, permission: string): boolean {
  if (!user) return false;
  
  // Admin always has all permissions
  if (user.role_name === 'admin') return true;
  
  // Check if user has the specific permission
  return user.permissions?.includes(permission) || false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: UserWithPermissions | null, permissions: string[]): boolean {
  if (!user) return false;
  
  // Admin always has all permissions
  if (user.role_name === 'admin') return true;
  
  // Check if user has any of the permissions
  return permissions.some(perm => user.permissions?.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: UserWithPermissions | null, permissions: string[]): boolean {
  if (!user) return false;
  
  // Admin always has all permissions
  if (user.role_name === 'admin') return true;
  
  // Check if user has all permissions
  return permissions.every(perm => user.permissions?.includes(perm));
}

/**
 * Get user permissions from localStorage
 */
export function getUserPermissions(): UserWithPermissions | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user can perform an action
 */
export function canPerformAction(user: UserWithPermissions | null, action: string): boolean {
  return hasPermission(user, action);
}
