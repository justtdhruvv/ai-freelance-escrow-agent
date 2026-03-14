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

export interface UserData {
  name: string
  email: string
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
      
      // Store user data - either from API response or create from email
      if (result.user) {
        // Use user data from API response
        localStorage.setItem("userData", JSON.stringify(result.user))
      } else {
        // Fallback: create user data from email
        const name = data.email.split('@')[0]
        const userData = {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          email: data.email,
          role: 'User'
        }
        localStorage.setItem("userData", JSON.stringify(userData))
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

    return result
  }

  async fetchUserData(): Promise<UserData | null> {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return null

      const res = await fetch(`${API_BASE_URL}/user`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!res.ok) {
        // If API call fails, return stored data or null
        return this.getUserData()
      }

      const userData = await res.json()
      
      // Store fresh user data
      localStorage.setItem("userData", JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error("Error fetching user data:", error)
      // Return stored data as fallback
      return this.getUserData()
    }
  }

  logout() {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    localStorage.removeItem("userEmail")
  }

  isAuthenticated() {
    return !!localStorage.getItem("authToken")
  }

  async validateToken() {
    // Simple check - if token exists, consider it valid
    return this.isAuthenticated()
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

export const authService = new AuthService()