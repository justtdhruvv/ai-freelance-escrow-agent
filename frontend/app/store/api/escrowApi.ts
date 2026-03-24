import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Transaction, EscrowAccount } from '../slices/escrowSlice'

export interface DepositRequest {
  projectId: string
  amount: number
  description?: string
}

export interface ReleaseRequest {
  projectId: string
  milestoneId?: string
  amount: number
  description?: string
}

export interface RefundRequest {
  projectId: string
  amount: number
  reason: string
}

export const escrowApi = createApi({
  reducerPath: 'escrowApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Escrow', 'Transaction'],
  endpoints: (builder) => ({
    getAccount: builder.query<EscrowAccount, void>({
      query: () => '/escrow/account',
      providesTags: ['Escrow'],
    }),
    getTransactions: builder.query<Transaction[], { limit?: number; offset?: number }>({
      query: ({ limit, offset }) => ({
        url: '/escrow/transactions',
        params: { limit, offset },
      }),
      providesTags: ['Transaction'],
    }),
    deposit: builder.mutation<Transaction, DepositRequest>({
      query: (data) => ({
        url: '/escrow/deposit',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Escrow', 'Transaction'],
    }),
    release: builder.mutation<Transaction, ReleaseRequest>({
      query: (data) => ({
        url: '/escrow/release',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Escrow', 'Transaction'],
    }),
    refund: builder.mutation<Transaction, RefundRequest>({
      query: (data) => ({
        url: '/escrow/refund',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Escrow', 'Transaction'],
    }),
  }),
})

export const {
  useGetAccountQuery,
  useGetTransactionsQuery,
  useDepositMutation,
  useReleaseMutation,
  useRefundMutation,
} = escrowApi
