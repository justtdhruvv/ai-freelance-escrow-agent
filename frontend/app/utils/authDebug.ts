// Auth Debugging Utility

export const debugAuth = () => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering - no localStorage available')
    return
  }

  const token = localStorage.getItem('authToken')
  const userStr = localStorage.getItem('user')
  
  console.log('=== Auth Debug Info ===')
  console.log('Token exists:', !!token)
  console.log('Token length:', token?.length || 0)
  console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'N/A')
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      console.log('User data:', user)
    } catch (e) {
      console.log('User data parse error:', e)
    }
  } else {
    console.log('No user data found')
  }
  
  // Check Redux state
  const storeState = (window as any).__REDUX_STORE__?.getState()
  if (storeState) {
    console.log('Redux auth state:', {
      isAuthenticated: storeState.auth?.isAuthenticated,
      hasToken: !!storeState.auth?.token,
      tokenLength: storeState.auth?.token?.length || 0,
      user: storeState.auth?.user
    })
  } else {
    console.log('Redux store not accessible from window')
  }
  
  console.log('=====================')
}

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('authToken', token)
  console.log('Auth token set successfully')
  debugAuth()
}

export const clearAuth = () => {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
  console.log('Auth cleared')
  debugAuth()
}

// Make debug functions available globally for debugging
if (typeof window !== 'undefined') {
  const globalWindow = window as any
  globalWindow.debugAuth = debugAuth
  globalWindow.setAuthToken = setAuthToken
  globalWindow.clearAuth = clearAuth
}
