'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import { authService } from '../services/authService'

interface FormData {
  email: string
}

interface FormErrors {
  email?: string
  general?: string
}

export default function ForgotPasswordForm() {
  const [formData, setFormData] = useState<FormData>({
    email: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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
    
    // Reset success state when user starts typing again
    if (isSuccess) {
      setIsSuccess(false)
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
      await authService.forgotPassword({
        email: formData.email
      })

      setIsSuccess(true)
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to send reset link. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-8 h-8 text-green-600" />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Reset Link Sent!
        </h3>
        
        <p className="text-gray-600 mb-6">
          We've sent a password reset link to<br />
          <span className="font-medium text-[#AD7D56]">{formData.email}</span>
        </p>
        
        <p className="text-sm text-gray-500 mb-8">
          Please check your email and follow the instructions to reset your password.
        </p>
        
        <div className="space-y-3">
          <motion.a
            href="/login"
            className="block w-full py-3 px-4 bg-[#AD7D56] text-white font-medium rounded-lg hover:bg-[#8B6344] transition-colors text-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back to Sign In
          </motion.a>
          
          <button
            onClick={() => {
              setIsSuccess(false)
              setFormData({ email: '' })
              setErrors({})
            }}
            className="block w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Send to another email
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-[#AD7D56]/10 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Mail className="w-8 h-8 text-[#AD7D56]" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Forgot Password?
        </h2>
        
        <p className="text-gray-600">
          No worries, we'll send you reset instructions.
        </p>
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
          placeholder="Enter your email address"
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
            Sending reset link...
          </>
        ) : (
          'Send Reset Link'
        )}
      </motion.button>

      {/* Back to Sign In */}
      <div className="text-center">
        <motion.a
          href="/login"
          className="text-sm text-[#AD7D56] hover:text-[#8B6344] transition-colors inline-flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back to Sign In
        </motion.a>
      </div>
    </form>
  )
}
