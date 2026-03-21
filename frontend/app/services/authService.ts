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

    return result
  }

  logout() {
    localStorage.removeItem("authToken")
  }

  isAuthenticated() {
    return !!localStorage.getItem("authToken")
  }
}

export const authService = new AuthService()