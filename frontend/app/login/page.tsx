'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthLayout from '../components/AuthLayout'
import LoginForm from '../components/LoginForm'
import { authService } from '../services/authService'

export default function LoginPage() {
  const [message, setMessage] = useState<string>('')
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if user is already authenticated
    if (authService.isAuthenticated()) {
      window.location.href = '/dashboard'
      return
    }

    // Check for success message from signup
    const messageParam = searchParams?.get('message')
    if (messageParam) {
      setMessage(messageParam)
    }

    // Check for remember me preference
    const rememberMe = localStorage.getItem('rememberMe')
    if (rememberMe === 'true') {
      // You could pre-fill the email field here if you store it
    }
  }, [searchParams])

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your account to continue"
    >
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{message}</p>
        </div>
      )}
      
      <LoginForm />
    </AuthLayout>
  )
}
