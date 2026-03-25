const API_BASE_URL = "http://localhost:3000"

export interface LoginData {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  role?: string
}

export interface AuthResponse {
  success: boolean
  token: string
  user: {
    user_id: string
    name: string
    email: string
    role: string
    pfi_score: number
    trust_score: number
    created_at: string
  }
}

class AuthService {

  async login(data: LoginData): Promise<AuthResponse> {

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(result.error || "Login failed")
    }

    if (result.token) {
      localStorage.setItem("authToken", result.token)
      if (result.user?.user_id) {
        localStorage.setItem("userId", result.user.user_id)
      }
    }

    return result
  }

  async signup(data: SignupData): Promise<AuthResponse> {

    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(result.error || "Signup failed")
    }

    if (result.token) {
      localStorage.setItem("authToken", result.token)
      if (result.user?.user_id) {
        localStorage.setItem("userId", result.user.user_id)
      }
    }

    return result
  }

  logout() {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userId")
  }

  isAuthenticated() {
    return !!localStorage.getItem("authToken")
  }

  async validateToken() {
    const token = localStorage.getItem("authToken")
    if (!token) return false
    
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      return res.ok
    } catch {
      return false
    }
  }
}

export const authService = new AuthService()