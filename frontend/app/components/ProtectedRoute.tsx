'use client'

import { motion } from 'framer-motion'
import { Loader2, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getUserRole, canAccessRoute, UserRole } from '../utils/roleGuard'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  fallbackRoute?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles, 
  fallbackRoute = '/dashboard' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth('/login')
  const userRole = getUserRole()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-[#AD7D56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-[#AD7D56] animate-spin" />
          </div>
          <p className="text-gray-600">Verifying authentication...</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You need to be authenticated to view this page.
          </p>
          <motion.a
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-[#AD7D56] text-white font-medium rounded-lg hover:bg-[#8B6344] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In
          </motion.a>
        </motion.div>
      </div>
    )
  }

  // Check role-based access
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You need {requiredRole} privileges to access this page.
          </p>
          <motion.a
            href={fallbackRoute}
            className="inline-flex items-center px-6 py-3 bg-[#AD7D56] text-white font-medium rounded-lg hover:bg-[#8B6344] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.a>
        </motion.div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Your role ({userRole}) is not authorized to access this page.
          </p>
          <motion.a
            href={fallbackRoute}
            className="inline-flex items-center px-6 py-3 bg-[#AD7D56] text-white font-medium rounded-lg hover:bg-[#8B6344] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.a>
        </motion.div>
      </div>
    )
  }

  // Check route-based access
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  if (!canAccessRoute(currentPath, userRole)) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Your role ({userRole}) cannot access this page: {currentPath}
          </p>
          <motion.a
            href={fallbackRoute}
            className="inline-flex items-center px-6 py-3 bg-[#AD7D56] text-white font-medium rounded-lg hover:bg-[#8B6344] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.a>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
