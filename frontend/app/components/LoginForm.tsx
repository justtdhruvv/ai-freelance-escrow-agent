'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useDispatch } from 'react-redux'
import { authService } from '../services/authService'
import { loginSuccess } from '../store/slices/authSlice'

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
  const dispatch = useDispatch()
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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email'
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

      // ✅ Try getting role from response
      let role = response?.user?.role

      // ✅ Fallback: extract from token
      if (!role) {
        const token = localStorage.getItem('authToken')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          role = payload.role
        }
      }

      // ✅ Save role
      if (role) {
        localStorage.setItem('role', role)
      }

      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true")
      }

      // Sync Redux immediately so role-dependent UI renders correctly without page reload
      dispatch(loginSuccess({
        user: {
          id: response.user.user_id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
        },
        token: response.token,
      }))

      router.replace("/dashboard")

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Login failed"
      })
    } finally {
      setIsLoading(false)
    }
  }

 return (
    // <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
      >

        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">
            Login to your EscrowAI account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:outline-none"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-[#AD7D56]"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-[#AD7D56] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Error */}
          {errors.general && (
            <p className="text-red-500 text-sm">{errors.general}</p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
          </button>

        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-3 text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Sign Up */}
        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <button
            onClick={() => router.push('/signup')}
            className="text-[#AD7D56] font-medium hover:underline"
          >
            Sign up
          </button>
        </p>

      </motion.div>
    // </div>
  )
}