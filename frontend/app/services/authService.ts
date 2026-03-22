import { TokenManager } from '../utils/authToken'

const API_BASE_URL = "http://localhost:3000/auth"

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  role?: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role?: string
  }

  getUserData(): UserData | null {
    try {
      const userData = localStorage.getItem("userData")
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error parsing user data:", error)
      return null
    }
  }

  setUserData(userData: UserData) {
    localStorage.setItem("userData", JSON.stringify(userData))
  }
}

class AuthService {

  async login(data: LoginData): Promise<LoginResponse> {
    console.log('AuthService: Starting login process', { email: data.email })

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await res.json()

      if (!res.ok) {
        console.error('AuthService: Login failed', {
          status: res.status,
          message: result.message || "Login failed"
        })
        throw new Error(result.message || "Login failed")
      }

      if (!result.token) {
        console.error('AuthService: No token in response')
        throw new Error("No token received from server")
      }

      // Use TokenManager for consistent token storage
      TokenManager.setToken(result.token)
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(result.user))

      console.log('AuthService: Login successful', {
        userId: result.user.id,
        role: result.user.role,
        tokenPreview: result.token.substring(0, 20) + '...'
      })

      return result
    } catch (error) {
      console.error('AuthService: Login error:', error)
      throw error
    }
  }

  async signup(data: SignupData) {
    console.log('AuthService: Starting signup process', { email: data.email, role: data.role })

    try {
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await res.json()

      if (!res.ok) {
        console.error('AuthService: Signup failed', {
          status: res.status,
          message: result.message || "Signup failed"
        })
        throw new Error(result.message || "Signup failed")
      }

      console.log('AuthService: Signup successful')
      return result
    } catch (error) {
      console.error('AuthService: Signup error:', error)
      throw error
    }
  }

  logout(): void {
    console.log('AuthService: Logging out user')
    
    // Use TokenManager for consistent token removal
    TokenManager.removeToken()
    localStorage.removeItem('user')
    
    console.log('AuthService: Logout completed')
  }

  isAuthenticated(): boolean {
    const hasToken = TokenManager.hasValidToken()
    console.log('AuthService: Authentication check', { hasToken })
    return hasToken
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return null
      
      return JSON.parse(userStr)
    } catch (error) {
      console.error('AuthService: Error parsing user data:', error)
      return null
    }
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    const hasRole = user?.role === role
    
    console.log('AuthService: Role check', { 
      userRole: user?.role, 
      requiredRole: role, 
      hasRole 
    })
    
    return hasRole
  }

  // Debug authentication state
  debugAuth(): void {
    console.log('=== AuthService Debug ===')
    TokenManager.debugToken()
    
    const user = this.getCurrentUser()
    console.log('Current user:', user)
    console.log('Is authenticated:', this.isAuthenticated())
    console.log('======================')
  }
}

export const authService = new AuthService()

// Make authService available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authService = authService
}