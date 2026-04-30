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
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
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

    return headers
  },
})

/**
 * Enhanced base query with error handling and token refresh
 */
const PUBLIC_ENDPOINTS = ['auth/login', 'auth/signup', 'auth/register']

export const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  const url = typeof args === 'string' ? args : args?.url ?? ''
  const isPublic = PUBLIC_ENDPOINTS.some(e => url.includes(e))

  if (!isPublic && !TokenManager.hasValidToken()) {
    return {
      error: {
        status: 401,
        data: {
          message: 'No valid authentication token available'
        }
      }
    }
  }

  const result = await baseQuery(args, api, extraOptions)

  if (result.data) {
    if (typeof result.data === 'string' && result.data.includes('<!DOCTYPE html>')) {
      console.error('API Error: Received HTML response - check backend URL configuration')
      return {
        error: {
          status: 500,
          data: {
            message: 'API endpoint returned HTML instead of JSON.'
          }
        }
      }
    }
  }

  return result
}

/**
 * Base API configuration for all endpoints
 */
export const baseApiConfig = {
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User', 'Project', 'Client', 'Contract', 'Brief', 'Escrow', 'Review', 'SOP', 'Milestone', 'Wallet', 'Transaction', 'Payment'],
  keepUnusedDataFor: 60, // Keep data for 60 seconds
  refetchOnMountOrArgChange: 30, // Refetch if data is older than 30 seconds
  refetchOnFocus: true,
  refetchOnReconnect: true,
}
