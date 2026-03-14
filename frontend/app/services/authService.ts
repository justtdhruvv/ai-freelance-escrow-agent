// Authentication Service
// Handles all authentication operations

const API_BASE_URL = '/api'

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  role: string
}

export interface ForgotPasswordData {
  email: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  message?: string
}

export interface AuthError {
  message: string
  status?: number
}

class AuthService {
  private token: string | null = null

  constructor() {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken')
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

  // Store token in localStorage (client side only)
  private setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
  }

  // Remove token from localStorage (client side only)
  private removeToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const formData = new FormData()
      formData.append("email", data.email)
      formData.append("password", data.password)

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      this.setToken(result.token || null)
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

      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      this.setToken(result.token || null)
      return result
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  // Forgot password
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    try {
      const formData = new FormData()
      formData.append("email", data.email)

      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  }

  // Logout user
  logout(): void {
    this.removeToken()
  }

  // Validate token (optional - for token verification)
  async validateToken(): Promise<boolean> {
    if (!this.token) return false

    try {
      const response = await fetch(`${API_BASE_URL}/validate`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.token}`
        }
      })

      if (!response.ok) {
        this.removeToken()
        return false
      }

      return true
    } catch (error) {
      console.error('Token validation error:', error)
      this.removeToken()
      return false
    }
  }
}

// Create singleton instance
const authService = new AuthService()

export { authService }
