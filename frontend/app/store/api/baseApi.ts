/**
 * Base API Configuration with Secure Token Management
 * Provides consistent authentication across all RTK Query APIs
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { TokenManager } from '../../utils/authToken'
import type { RootState } from '../index'

/**
 * Enhanced base query with secure token handling
 */
export const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:3000/',
  prepareHeaders: (headers, { getState, type, endpoint }) => {
    // Get auth headers using TokenManager
    const authHeaders = TokenManager.getAuthHeader()
    
    // Apply auth headers
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value)
    })
    
    // Set content type for mutations
    if (type === 'mutation') {
      headers.set('Content-Type', 'application/json')
    }
    
    // Accept JSON responses
    headers.set('Accept', 'application/json')
    
    // Debug logging for API calls
    console.log(`=== API Call Debug ===`)
    console.log(`Endpoint: ${endpoint}`)
    console.log(`Type: ${type}`)
    console.log(`Base URL: http://localhost:3000/`)
    console.log(`Full URL: http://localhost:3000/${endpoint}`)
    console.log(`Has Auth Header: ${headers.has('authorization')}`)
    console.log(`Auth Header: ${headers.get('authorization')?.substring(0, 30) || 'None'}...`)
    console.log(`Accept Header: ${headers.get('accept')}`)
    console.log(`=====================`)
    
    return headers
  },
})

/**
 * Enhanced base query with error handling and token refresh
 */
export const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  // Check if we have a valid token before making the request
  if (!TokenManager.hasValidToken()) {
    console.error('API Error: No valid token available')
    return {
      error: {
        status: 401,
        data: {
          message: 'No valid authentication token available'
        }
      }
    }
  }
  
  // Make the API call
  const result = await baseQuery(args, api, extraOptions)
  
  // Enhanced response validation
  if (result.data) {
    console.log('=== API Response Debug ===')
    console.log('Response Type:', typeof result.data)
    console.log('Is Array:', Array.isArray(result.data))
    console.log('Has Clients Property:', result.data && typeof result.data === 'object' && 'clients' in result.data)
    
    // Check if response is HTML (indicates wrong endpoint)
    if (typeof result.data === 'string' && result.data.includes('<!DOCTYPE html>')) {
      console.error('API Error: Received HTML response - wrong endpoint called!')
      console.error('Response preview:', result.data.substring(0, 200) + '...')
      return {
        error: {
          status: 500,
          data: {
            message: 'API endpoint returned HTML instead of JSON. Check if backend server is running on correct port.'
          }
        }
      }
    }
    
    console.log('Response Data:', result.data)
    console.log('========================')
  }
  
  // Handle 401 errors
  if (result.error && result.error.status === 401) {
    console.error('API Error: 401 Unauthorized - Token may be expired or invalid')
    
    // Log detailed error information
    console.log('401 Error Details:', {
      endpoint: typeof args === 'string' ? args : args.url,
      hasToken: TokenManager.hasValidToken(),
      tokenPreview: TokenManager.getToken()?.substring(0, 20) + '...',
    })
    
    // Optionally clear invalid token
    // TokenManager.removeToken()
  }
  
  // Handle other HTTP errors
  if (result.error && typeof result.error.status === 'number' && result.error.status >= 400) {
    console.error('API Error:', {
      status: result.error.status,
      data: result.error.data,
      endpoint: typeof args === 'string' ? args : args.url
    })
  }
  
  return result
}

/**
 * Base API configuration for all endpoints
 */
export const baseApiConfig = {
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User', 'Project', 'Client', 'Contract', 'Brief', 'Escrow', 'Review', 'SOP', 'Milestone', 'MilestoneSubmission', 'MilestoneChecks'],
  keepUnusedDataFor: 60, // Keep data for 60 seconds
  refetchOnMountOrArgChange: 30, // Refetch if data is older than 30 seconds
  refetchOnFocus: true,
  refetchOnReconnect: true,
}
