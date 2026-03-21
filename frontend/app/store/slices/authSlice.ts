import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
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
      localStorage.setItem('authToken', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    loginFailure: (state) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.token = null
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('authToken')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          state.token = token
          state.user = user
          state.isAuthenticated = true
        } catch {
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
        }
      }
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, initializeAuth } = authSlice.actions
export default authSlice.reducer
