// 权限常量定义
export const PERMISSIONS = {
  // 客户管理
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  
  // 发票管理
  INVOICE_CREATE: 'invoice:create',
  INVOICE_READ: 'invoice:read',
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_DELETE: 'invoice:delete',
  
  // 账单管理
  BILL_CREATE: 'bill:create',
  BILL_READ: 'bill:read',
  BILL_UPDATE: 'bill:update',
  BILL_DELETE: 'bill:delete',
  BILL_COMPLETE: 'bill:complete',
  
  // 用户管理
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // 系统管理
  SYSTEM_ADMIN: 'system:admin',
} as const;

// 权限组定义
const BASIC_PERMISSIONS = [
  PERMISSIONS.CUSTOMER_READ,
  PERMISSIONS.INVOICE_READ,
  PERMISSIONS.BILL_READ,
];

const OPERATOR_PERMISSIONS = [
  ...BASIC_PERMISSIONS,
  PERMISSIONS.CUSTOMER_CREATE,
  PERMISSIONS.CUSTOMER_UPDATE,
  PERMISSIONS.INVOICE_CREATE,
  PERMISSIONS.INVOICE_UPDATE,
  PERMISSIONS.BILL_CREATE,
  PERMISSIONS.BILL_UPDATE,
  PERMISSIONS.BILL_COMPLETE,
];

const ADMIN_PERMISSIONS = [
  ...OPERATOR_PERMISSIONS,
  PERMISSIONS.CUSTOMER_DELETE,
  PERMISSIONS.INVOICE_DELETE,
  PERMISSIONS.BILL_DELETE,
  PERMISSIONS.USER_READ,
  PERMISSIONS.SYSTEM_ADMIN,
];

export const PERMISSION_GROUPS = {
  // 基础用户权限
  BASIC: BASIC_PERMISSIONS,
  
  // 操作员权限
  OPERATOR: OPERATOR_PERMISSIONS,
  
  // 管理员权限
  ADMIN: ADMIN_PERMISSIONS,
  
  // 超级管理员权限
  SUPER_ADMIN: Object.values(PERMISSIONS),
} as const;

// 检查权限函数
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes(PERMISSIONS.SYSTEM_ADMIN);
}

// 检查是否有任一权限
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

// 检查是否有所有权限
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

// 检查是否是管理员
export function isAdmin(isAdminFlag: boolean): boolean {
  return isAdminFlag;
}