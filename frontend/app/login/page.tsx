'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "../components/LoginForm"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated and redirect
    const token = localStorage.getItem("authToken")
    if (token) {
      router.replace("/dashboard")
    }
  }, []) // Empty dependency array - runs only once

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Login
        </h1>

        <LoginForm />
      </div>
    </div>
  )
}