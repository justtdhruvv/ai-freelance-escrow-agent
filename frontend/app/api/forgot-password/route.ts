import { NextRequest, NextResponse } from 'next/server'

// Your backend API URL
const BACKEND_API_URL = 'http://localhost:3001' // Replace with your actual backend URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { email } = body

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Forward request to your actual backend API
    const response = await fetch(`${BACKEND_API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Password reset failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
