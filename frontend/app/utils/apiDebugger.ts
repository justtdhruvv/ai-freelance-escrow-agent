/**
 * API Debugging Utility
 * Helps identify HTML vs JSON response issues
 */

export class ApiDebugger {
  /**
   * Test direct API call to verify backend connectivity
   */
  static async testBackendEndpoint(endpoint: string = '/clients'): Promise<void> {
    console.log(`=== Testing Backend Endpoint: http://localhost:3000${endpoint} ===`)
    
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      console.log('Response Status:', response.status)
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
      
      const contentType = response.headers.get('content-type')
      console.log('Content-Type:', contentType)
      
      if (contentType?.includes('application/json')) {
        const data = await response.json()
        console.log('✅ SUCCESS: Received JSON response')
        console.log('Data Structure:', data)
        console.log('Has clients property:', 'clients' in data)
        console.log('Clients count:', Array.isArray(data.clients) ? data.clients.length : 'N/A')
      } else {
        const text = await response.text()
        console.log('❌ ERROR: Received non-JSON response')
        console.log('Response preview (first 500 chars):', text.substring(0, 500))
        
        if (text.includes('<!DOCTYPE html>')) {
          console.log('🔍 DIAGNOSIS: This is HTML - frontend is calling itself!')
          console.log('Expected: Backend API at http://localhost:3000/clients')
          console.log('Actual: Frontend route or wrong server')
        }
      }
    } catch (error) {
      console.error('❌ NETWORK ERROR:', error)
      console.log('🔍 DIAGNOSIS: Backend server not running or wrong port')
    }
    
    console.log('=====================================')
  }
  
  /**
   * Check if frontend is running on expected port
   */
  static checkFrontendPort(): void {
    const frontendPort = window.location.port
    const frontendHost = window.location.hostname
    
    console.log('=== Frontend Port Check ===')
    console.log('Frontend URL:', window.location.href)
    console.log('Frontend Host:', frontendHost)
    console.log('Frontend Port:', frontendPort)
    
    if (frontendPort === '3000') {
      console.warn('⚠️ WARNING: Frontend is running on port 3000')
      console.warn('This conflicts with backend which should be on port 3000')
      console.warn('Consider running frontend on a different port (e.g., 3001, 8080)')
    } else {
      console.log('✅ Frontend is on port', frontendPort, '- good!')
    }
    
    console.log('===========================')
  }
  
  /**
   * Validate API configuration
   */
  static validateApiConfig(): void {
    console.log('=== API Configuration Check ===')
    
    // Check if we can access the store
    const store = (window as any).__REDUX_STORE__
    if (store) {
      console.log('✅ Redux store accessible')
      
      // Check API state
      const apiState = store.getState().api
      if (apiState) {
        console.log('✅ RTK Query API state exists')
        
        // Check queries
        const queries = apiState.queries
        const clientsQuery = Object.keys(queries).find(key => key.includes('getClients'))
        
        if (clientsQuery) {
          const queryState = queries[clientsQuery]
          console.log('Clients Query State:', {
            status: queryState.status,
            endpointName: queryState.endpointName,
            startedAt: new Date(queryState.startedAt).toISOString()
          })
          
          if (queryState.status === 'rejected') {
            console.error('❌ Clients query failed:', queryState.error)
          }
        } else {
          console.log('Clients query not found in state')
        }
      } else {
        console.log('❌ RTK Query API state missing')
      }
    } else {
      console.log('❌ Redux store not accessible')
    }
    
    console.log('=============================')
  }
  
  /**
   * Run complete API diagnostics
   */
  static async runFullDiagnostics(): Promise<void> {
    console.log('🔧 Starting Complete API Diagnostics...\n')
    
    this.checkFrontendPort()
    this.validateApiConfig()
    await this.testBackendEndpoint('/clients')
    await this.testBackendEndpoint('/projects')
    
    console.log('\n🎯 Summary:')
    console.log('1. Check if backend server is running on http://localhost:3000')
    console.log('2. Ensure frontend is NOT running on port 3000')
    console.log('3. Verify API endpoints return JSON, not HTML')
    console.log('4. Check browser Network tab for actual request URLs')
  }
}

// Make debugger available globally
if (typeof window !== 'undefined') {
  (window as any).ApiDebugger = ApiDebugger
}
