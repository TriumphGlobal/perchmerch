export const USER_ROLES = {
  USER: "user",
  PLATFORM_ADMIN: "platformAdmin",
  SUPER_ADMIN: "superAdmin"
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const ROLE_LABELS = {
  [USER_ROLES.USER]: "User",
  [USER_ROLES.PLATFORM_ADMIN]: "Platform Admin",
  [USER_ROLES.SUPER_ADMIN]: "Super Admin"
} as const

export const ROLE_DESCRIPTIONS = {
  [USER_ROLES.USER]: "Regular user with basic access, can purchase products, create brands and manage them",
  [USER_ROLES.PLATFORM_ADMIN]: "Can moderate users, brands and products with temporary effect",
  [USER_ROLES.SUPER_ADMIN]: "Full access to all moderation, financial andplatform features and user management"
} as const

export const ROLE_HIERARCHY = {
  [USER_ROLES.USER]: 0,
  [USER_ROLES.PLATFORM_ADMIN]: 1,
  [USER_ROLES.SUPER_ADMIN]: 2
} as const

export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role]
} 