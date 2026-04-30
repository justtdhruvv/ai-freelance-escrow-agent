import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TokenManager } from '../../utils/authToken'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      
      // Use TokenManager for consistent token storage
      TokenManager.setToken(action.payload.token)

      // Store user info in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('role', action.payload.user.role ?? 'freelancer')
    },
    loginFailure: (state) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.token = null
      
      // Clear token using TokenManager
      TokenManager.removeToken()
      localStorage.removeItem('user')
      localStorage.removeItem('role')
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
      
      // Clear token using TokenManager
      TokenManager.removeToken()
      localStorage.removeItem('user')
      localStorage.removeItem('role')
    },
    initializeAuth: (state) => {
      // Initialize token using TokenManager
      TokenManager.initialize()
      
      const token = TokenManager.getToken()
      const userStr = localStorage.getItem('user')
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          if (!user.role) {
            user.role = localStorage.getItem('role') ?? 'freelancer'
          }
          state.token = token
          state.user = user
          state.isAuthenticated = true
        } catch (error) {
          console.error('AuthSlice: Error parsing user data:', error)
          // Clear invalid data
          TokenManager.removeToken()
          localStorage.removeItem('user')
        }
      }
    },
    refreshToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      
      // Update token using TokenManager
      TokenManager.setToken(action.payload)
    },
  },
})

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  initializeAuth,
  refreshToken 
} = authSlice.actions

export default authSlice.reducer
