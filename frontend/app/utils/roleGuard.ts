export type UserRole = 'employer' | 'freelancer' | 'admin'

export interface UserPermissions {
  canViewClients: boolean
  canViewEscrowWallet: boolean
  canViewPFIScore: boolean
  canAccessDashboard: boolean
}

// ✅ Get role safely from localStorage
export const getUserRole = (): UserRole => {
  if (typeof window === 'undefined') return 'freelancer'

  const role = localStorage.getItem('role')
  return (role as UserRole) || 'freelancer'
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
    employer: ['/dashboard/clients', '/dashboard/wallet', '/dashboard/pfi-score'],
    freelancer: [],
    admin: []
  }

  return !restrictedRoutes[userRole].includes(route)
}