'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { authService } from '../services/authService'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { loginSuccess } from '../store/slices/authSlice'

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
  text: string
}

export default function SignupForm() {
  const [role, setRole] = useState<'freelancer' | 'employer'>('freelancer')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'bg-gray-300',
    text: 'Enter a password'
  })

  const dispatch = useDispatch()
  const router = useRouter()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    if (!password) {
      return { score: 0, feedback: [], color: 'bg-gray-300', text: 'Enter a password' }
    }

    // Length check
    if (password.length >= 8) {
      score += 25
    } else {
      feedback.push('At least 8 characters')
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 25
    } else {
      feedback.push('One uppercase letter')
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 25
    } else {
      feedback.push('One lowercase letter')
    }

    // Number or special character check
    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 25
    } else {
      feedback.push('One number or special character')
    }

    let color = 'bg-red-500'
    let text = 'Weak'

    if (score >= 75) {
      color = 'bg-green-500'
      text = 'Strong'
    } else if (score >= 50) {
      color = 'bg-yellow-500'
      text = 'Medium'
    } else if (score >= 25) {
      color = 'bg-orange-500'
      text = 'Fair'
    }

    return { score, feedback, color, text }
  }

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password))
  }, [formData.password])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (passwordStrength.score < 50) {
      newErrors.password = 'Password is too weak. Please make it stronger.'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await authService.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role
      })

      dispatch(loginSuccess({
        user: {
          id: response.user.user_id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
        },
        token: response.token,
      }))

      router.push('/dashboard?message=Account created successfully! Welcome!')
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Sign up failed. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          I am a...
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRole('freelancer')}
            className={`flex-1 py-2.5 px-4 rounded-lg border-2 font-medium text-sm transition-all duration-200 ${
              role === 'freelancer'
                ? 'border-[#AD7D56] bg-[#AD7D56] text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-[#AD7D56]'
            }`}
          >
            Freelancer
          </button>
          <button
            type="button"
            onClick={() => setRole('employer')}
            className={`flex-1 py-2.5 px-4 rounded-lg border-2 font-medium text-sm transition-all duration-200 ${
              role === 'employer'
                ? 'border-[#AD7D56] bg-[#AD7D56] text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-[#AD7D56]'
            }`}
          >
            Client
          </button>
        </div>
      </div>

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
            errors.name
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:border-[#AD7D56] focus:ring-[#AD7D56]'
          }`}
          placeholder="Enter your full name"
          disabled={isLoading}
        />
        {errors.name && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.name}
          </motion.p>
        )}
      </div>

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
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
            errors.email
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
            className="text-red-500 text-sm mt-1"
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
            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
              errors.password
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-[#AD7D56] focus:ring-[#AD7D56]'
            }`}
            placeholder="Create a password"
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
        
        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Password strength</span>
              <span className="text-xs font-medium" style={{ color: passwordStrength.color.replace('bg-', '#') }}>
                {passwordStrength.text}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${passwordStrength.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${passwordStrength.score}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {passwordStrength.feedback.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordStrength.feedback.map((feedback, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600">
                    <X className="w-3 h-3 mr-1 text-red-500" />
                    {feedback}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
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

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
              errors.confirmPassword
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-[#AD7D56] focus:ring-[#AD7D56]'
            }`}
            placeholder="Confirm your password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Password Match Indicator */}
        {formData.confirmPassword && (
          <div className="mt-1 flex items-center text-xs">
            {formData.password === formData.confirmPassword ? (
              <>
                <Check className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-600">Passwords match</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3 mr-1 text-red-500" />
                <span className="text-red-600">Passwords do not match</span>
              </>
            )}
          </div>
        )}
        
        {errors.confirmPassword && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.confirmPassword}
          </motion.p>
        )}
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
        disabled={isLoading || passwordStrength.score < 50}
        className="w-full py-3 px-4 bg-[#AD7D56] text-white font-medium rounded-lg hover:bg-[#8B6344] focus:ring-2 focus:ring-[#AD7D56] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        whileHover={{ scale: (isLoading || passwordStrength.score < 50) ? 1 : 1.02 }}
        whileTap={{ scale: (isLoading || passwordStrength.score < 50) ? 1 : 0.98 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </motion.button>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <motion.a
            href="/login"
            className="text-[#AD7D56] hover:text-[#8B6344] font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign in
          </motion.a>
        </p>
      </div>
    </form>
  )
}
