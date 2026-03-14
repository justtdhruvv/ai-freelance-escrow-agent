'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from "next/navigation"
import { authService } from '../services/authService'

interface FormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateForm()) return

  setIsLoading(true)
  setErrors({})

  try {

    const response = await authService.login({
      email: formData.email,
      password: formData.password
    })

    // Store email for fallback if needed
    localStorage.setItem('userEmail', formData.email)

    if (formData.rememberMe) {
      localStorage.setItem("rememberMe","true")
    }

    router.push("/dashboard")

  } catch (error) {

    setErrors({
      general: error instanceof Error ? error.message : "Login failed"
    })

  } finally {
    setIsLoading(false)
  }
}


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.email
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:border-[#AD7D56] focus:ring-[#AD7D56]'
            }`}
          placeholder="Enter your email"
          disabled={isLoading}
        />
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.email}
          </motion.p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.password
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:border-[#AD7D56] focus:ring-[#AD7D56]'
              }`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.password}
          </motion.p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            className="w-4 h-4 text-[#AD7D56] border-gray-300 rounded focus:ring-[#AD7D56] focus:ring-2"
            disabled={isLoading}
          />
          <span className="ml-2 text-sm text-gray-600">Remember me</span>
        </label>

        {/* <motion.a
          href="/forgot-password"
          className="text-sm text-[#AD7D56] hover:text-[#8B6344] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Forgot password?
        </motion.a> */}
      </div>

      {/* General Error */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-600">{errors.general}</p>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-[#AD7D56] text-white font-medium rounded-lg hover:bg-[#8B6344] focus:ring-2 focus:ring-[#AD7D56] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </motion.button>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <motion.a
            href="/signup"
            className="text-[#AD7D56] hover:text-[#8B6344] font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign up
          </motion.a>
        </p>
      </div>
    </form>
  )
}
