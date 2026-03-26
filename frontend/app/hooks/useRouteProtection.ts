'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserRole, canAccessRoute } from '../utils/roleGuard'

export function useRouteProtection() {
  const router = useRouter()
  const userRole = getUserRole()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }

    // Check current route access
    const currentPath = window.location.pathname
    if (!canAccessRoute(currentPath, userRole)) {
      console.log(`Access denied for role ${userRole} to route ${currentPath}`)
      router.push('/dashboard')
      return
    }
  }, [router, userRole])

  return { userRole }
}
