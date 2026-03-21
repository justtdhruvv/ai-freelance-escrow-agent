import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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
  reducerPath: 'clientsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Client'],
  endpoints: (builder) => ({
    getClients: builder.query<ClientsResponse, void>({
      query: () => '/clients',
      providesTags: ['Client'],
      transformResponse: (response: ClientsResponse) => response,
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
    }),
  }),
})

export const {
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
} = clientsApi
