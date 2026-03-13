// Authentication Service
// Handles user authentication and token management

const API_BASE_URL = 'http://localhost:3000'

export interface User {
  id: string
  email: string
  name: string
  role: 'employer' | 'freelancer'
}

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  role: 'employer' | 'freelancer'
}

export interface AuthResponse {
  user: User
  token: string
}

class AuthService {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken')
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const formData = new FormData()
      formData.append("email", data.email)
      formData.append("password", data.password)

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      this.token = result.token || null
      if (this.token) {
        localStorage.setItem('authToken', this.token)
      }
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Signup user
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("email", data.email)
      formData.append("password", data.password)
      formData.append("role", data.role)

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      this.token = result.token || null
      if (this.token) {
        localStorage.setItem('authToken', this.token)
      }
      return result
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }

  // Logout user
  logout(): void {
    this.token = null
    localStorage.removeItem('authToken')
  }

  // Get auth headers for API calls
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }
}

// Export singleton instance
export const authService = new AuthService()
