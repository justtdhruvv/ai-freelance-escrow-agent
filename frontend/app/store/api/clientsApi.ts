import { createApi } from '@reduxjs/toolkit/query/react'
import { baseApiConfig } from './baseApi'

export interface Client {
  user_id: string
  email: string
  pfi_score: number
  trust_score: number
  created_at: string
}

export interface ClientsResponse {
  clients: Client[]
}

export interface CreateClientRequest {
  email: string
}

export const clientsApi = createApi({
  ...baseApiConfig,
  reducerPath: 'clientsApi',
  tagTypes: ['Client'],
  endpoints: (builder) => ({
    getClients: builder.query<ClientsResponse, void>({
      query: () => '/clients',
      providesTags: ['Client'],
      transformResponse: (response: ClientsResponse | Client[] | string) => {
        console.log('=== Clients API Response Analysis ===')
        console.log('Raw Response Type:', typeof response)
        console.log('Is Array:', Array.isArray(response))
        console.log('Has Clients Property:', response && typeof response === 'object' && 'clients' in response)
        
        // Check if response is HTML (wrong endpoint)
        if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
          console.error('❌ CRITICAL ERROR: Received HTML instead of JSON!')
          console.error('This indicates the frontend is calling itself instead of the backend API')
          console.error('Expected: http://localhost:3000/clients (backend)')
          console.error('Actual: Possibly calling frontend route /dashboard/clients')
          console.error('HTML Preview:', response.substring(0, 300) + '...')
          return { clients: [] }
        }
        
        // Handle both response formats:
        // 1. { clients: [...] } - wrapped response (expected backend format)
        // 2. [...] - direct array response (fallback)
        if (Array.isArray(response)) {
          console.log('✅ Direct array response, wrapping in object')
          console.log('Client Count:', response.length)
          return { clients: response }
        } else if (response && typeof response === 'object' && 'clients' in response && Array.isArray((response as any).clients)) {
          console.log('✅ Wrapped response with clients array')
          console.log('Client Count:', (response as any).clients.length)
          return response as ClientsResponse
        } else {
          console.warn('⚠️ Unexpected response format:', response)
          console.warn('Expected either { clients: [...] } or [...]')
          return { clients: [] }
        }
      },
    }),
    getClient: builder.query<Client, string>({
      query: (id) => `/clients/${id}`,
      providesTags: (result, error, id) => [{ type: 'Client', id }],
    }),
    createClient: builder.mutation<Client, CreateClientRequest>({
      query: (client) => ({
        url: '/clients',
        method: 'POST',
        body: client,
      }),
      invalidatesTags: ['Client'],
      transformErrorResponse: (error) => {
        console.error('Create Client Error:', error)
        return error
      },
    }),
  }),
})

export const {
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
} = clientsApi
