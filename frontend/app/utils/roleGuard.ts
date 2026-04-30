export type UserRole = 'employer' | 'freelancer' | 'admin'

export interface UserPermissions {
  canViewClients: boolean
  canViewEscrowWallet: boolean
  canViewPFIScore: boolean
  canAccessDashboard: boolean
}

// ✅ Get role — localStorage first, JWT decode as fallback
export const getUserRole = (): UserRole => {
  if (typeof window === 'undefined') return 'freelancer'

  const role = localStorage.getItem('role')
  if (role === 'employer' || role === 'freelancer' || role === 'admin') {
    return role as UserRole
  }

  // localStorage missing or invalid — decode JWT directly as authoritative source
  const token = localStorage.getItem('authToken')
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role === 'employer' || payload.role === 'freelancer') {
        return payload.role as UserRole
      }
    } catch {
      // malformed token — fall through to default
    }
  }

  return 'freelancer'
}

// ✅ Permissions based on role
export function getUserPermissions(role?: UserRole): UserPermissions {
  const userRole = role || getUserRole()

  return {
    canViewClients: userRole === 'freelancer' || userRole === 'admin',
    canViewEscrowWallet: userRole === 'freelancer' || userRole === 'admin',
    canViewPFIScore: userRole === 'freelancer' || userRole === 'admin',
    canAccessDashboard: true
  }
}

// ✅ Check permission
export function hasPermission(permission: keyof UserPermissions, role?: UserRole): boolean {
  const permissions = getUserPermissions(role)
  return permissions[permission]
}

// ✅ Role-based check
export function requireRole(allowedRoles: UserRole[], role?: UserRole): boolean {
  const userRole = role || getUserRole()
  return allowedRoles.includes(userRole)
}

// ✅ Route protection
export function canAccessRoute(route: string, role?: UserRole): boolean {
  const userRole = role || getUserRole()

  const restrictedRoutes: Record<UserRole, string[]> = {
    employer: ['/dashboard/clients', '/dashboard/wallet', '/dashboard/pfi-score', '/dashboard/milestones', '/dashboard/ai-reviews'],
    freelancer: [],
    admin: []
  }

  return !restrictedRoutes[userRole].includes(route)
}