'use client'

import { useEffect } from 'react'
import AuthLayout from '../components/AuthLayout'
import SignupForm from '../components/SignupForm'
import { authService } from '../services/authService'

export default function SignupPage() {
  useEffect(() => {
    // Check if user is already authenticated
    if (authService.isAuthenticated()) {
      window.location.href = '/dashboard'
      return
    }
  }, [])

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join us today and get started"
    >
      <SignupForm />
    </AuthLayout>
  )
}
