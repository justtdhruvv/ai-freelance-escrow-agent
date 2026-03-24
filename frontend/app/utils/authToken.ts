/**
 * Secure JWT Token Management
 * Handles SSR issues, consistency, and debugging
 */

export class TokenManager {
  private static readonly TOKEN_KEY = 'authToken'
  
  /**
   * Safely get token from localStorage
   * Handles SSR by checking if window is defined
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') {
      console.warn('TokenManager: Cannot access localStorage on server-side')
      return null
    }
    
    try {
      const token = localStorage.getItem(this.TOKEN_KEY)
      if (!token) {
        console.warn('TokenManager: No token found in localStorage')
        return null
      }
      
      // Validate token format (basic JWT check)
      if (!this.isValidJWT(token)) {
        console.error('TokenManager: Invalid token format found')
        this.removeToken()
        return null
      }
      
      return token
    } catch (error) {
      console.error('TokenManager: Error accessing localStorage:', error)
      return null
    }
  }
  
  /**
   * Safely set token in localStorage
   */
  static setToken(token: string): void {
    if (typeof window === 'undefined') {
      console.warn('TokenManager: Cannot set localStorage on server-side')
      return
    }
    
    if (!token || !this.isValidJWT(token)) {
      console.error('TokenManager: Attempted to set invalid token')
      return
    }
    
    try {
      localStorage.setItem(this.TOKEN_KEY, token)
      console.log('TokenManager: Token set successfully')
      this.debugToken(token)
    } catch (error) {
      console.error('TokenManager: Error setting localStorage:', error)
    }
  }
  
  /**
   * Safely remove token from localStorage
   */
  static removeToken(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(this.TOKEN_KEY)
      console.log('TokenManager: Token removed successfully')
    } catch (error) {
      console.error('TokenManager: Error removing token:', error)
    }
  }
  
  /**
   * Basic JWT format validation
   */
  static isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    
    // JWT should have 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    try {
      // Try to decode the payload (basic validation)
      const payload = JSON.parse(atob(parts[1]))
      return payload && typeof payload === 'object'
    } catch {
      return false
    }
  }
  
  /**
   * Check if token exists and is valid
   */
  static hasValidToken(): boolean {
    return this.isValidJWT(this.getToken() || '')
  }
  
  /**
   * Get token for API requests with debugging
   */
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken()
    
    if (!token) {
      console.warn('TokenManager: No valid token available for API request')
      return {}
    }
    
    console.log('TokenManager: Attaching token to API request')
    return { Authorization: `Bearer ${token}` }
  }
  
  /**
   * Debug token information
   */
  static debugToken(token?: string): void {
    const tokenToDebug = token || this.getToken()
    
    if (!tokenToDebug) {
      console.log('TokenManager Debug: No token available')
      return
    }
    
    console.log('=== TokenManager Debug ===')
    console.log('Token exists:', !!tokenToDebug)
    console.log('Token length:', tokenToDebug.length)
    console.log('Token preview:', tokenToDebug.substring(0, 20) + '...')
    console.log('Token parts:', tokenToDebug.split('.').length)
    
    try {
      const payload = JSON.parse(atob(tokenToDebug.split('.')[1]))
      console.log('Token payload:', {
        sub: payload.sub,
        iat: payload.iat,
        exp: payload.exp,
        role: payload.role,
        // Don't log sensitive data
      })
      
      // Check expiration
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000)
        const isExpired = payload.exp < now
        console.log('Token expired:', isExpired)
        console.log('Token expires in:', payload.exp - now, 'seconds')
      }
    } catch (error) {
      console.error('TokenManager: Error parsing token payload:', error)
    }
    
    console.log('========================')
  }
  
  /**
   * Initialize token from localStorage on app load
   */
  static initialize(): void {
    if (typeof window === 'undefined') return
    
    const token = this.getToken()
    if (token) {
      console.log('TokenManager: Initialized with existing token')
      this.debugToken(token)
    } else {
      console.log('TokenManager: No existing token found')
    }
  }
}

// Export singleton instance
export default TokenManager
