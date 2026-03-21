'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '../services/authService'

export function useAuth(redirectTo?: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        // Simple token check - no server validation for now
        const isAuth = authService.isAuthenticated()
        
        if (!mounted) return

        if (isAuth) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          if (redirectTo) {
            router.replace(redirectTo)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (mounted) {
          setIsAuthenticated(false)
          if (redirectTo) {
            router.replace(redirectTo)
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [redirectTo, router])

  return { isAuthenticated, isLoading }
}
