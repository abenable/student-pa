// Role constants
export const ROLES = {
  USER: 'user',
  TEAM_MANAGER: 'team_manager',
  ENTERPRISE_MANAGER: 'enterprise_manager',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Permission helpers
export function isAdmin(role?: string | null): boolean {
  return role === ROLES.ADMIN || role === ROLES.ENTERPRISE_MANAGER
}

export function isTeamManager(role?: string | null): boolean {
  return role === ROLES.TEAM_MANAGER
}

export function isManagerOrAbove(role?: string | null): boolean {
  return isAdmin(role) || isTeamManager(role)
}

export function canAccessAdminDashboard(role?: string | null): boolean {
  return isAdmin(role)
}
