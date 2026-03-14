import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = 'http://localhost:3000/projects'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const client_id = searchParams.get('client_id')
    const freelancer_id = searchParams.get('freelancer_id')
    
    let url = BACKEND_API_URL
    if (client_id) {
      url += `?client_id=${client_id}`
    } else if (freelancer_id) {
      url += `?freelancer_id=${freelancer_id}`
    }

    // Extract and validate Authorization header
    const authHeader = request.headers.get('Authorization')
    
    // Validate Authorization header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or missing Authorization header. Format: Authorization: Bearer <token>',
          status: 401 
        },
        { status: 401 }
      )
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader // Forward the validated header
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Failed to fetch projects',
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Projects API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract and validate Authorization header
    const authHeader = request.headers.get('Authorization')
    
    // Validate Authorization header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or missing Authorization header. Format: Authorization: Bearer <token>',
          status: 401 
        },
        { status: 401 }
      )
    }

    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader // Forward validated header
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Failed to create project',
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('Create Project API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
