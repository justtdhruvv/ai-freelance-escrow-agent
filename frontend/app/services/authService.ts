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

class AuthService {

  async login(data: LoginData) {

    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(result.message || "Login failed")
    }

    if (result.token) {
      localStorage.setItem("authToken", result.token)
      if (result.user?.id) {
        localStorage.setItem("userId", result.user.id)
      }
    }

    return result
  }

  async signup(data: SignupData) {

    const res = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(result.message || "Signup failed")
    }

    if (result.token) {
      localStorage.setItem("authToken", result.token)
      if (result.user?.id) {
        localStorage.setItem("userId", result.user.id)
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
    // Simple check - if token exists, consider it valid
    return this.isAuthenticated()
  }
}

export const authService = new AuthService()