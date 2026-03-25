import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from './baseApi'

export interface WalletData {
  wallet_id: string
  freelancer_id: string
  balance: number
  available_balance: number
  pending_balance: number
  total_earned: number
  total_converted: number
  wallet_type: string
  currency: string
}

export interface Transaction {
  transaction_id: string
  type: 'credit' | 'debit' | 'conversion'
  amount: number
  description: string
  created_at: string
}

export interface WalletTransactionsResponse {
  success: boolean
  data: {
    transactions: Transaction[]
    pagination: {
      limit: number
      offset: number
      has_more: boolean
    }
  }
}

export interface AddCreditsRequest {
  freelancer_id: string
  amount: number
  description: string
}

export interface ConvertCreditsRequest {
  internal_amount: number
  conversion_rate?: number
}

export interface ConvertCreditsResponse {
  success: boolean
  data: {
    conversion_id: string
    internal_amount: number
    real_amount: number
    conversion_rate: number
    fees: number
    status: string
    estimated_arrival: string
  }
}

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Wallet', 'Transaction'],
  endpoints: (builder) => ({
    getWallet: builder.query<WalletData, void>({
      query: () => 'wallet',
      providesTags: ['Wallet'],
    }),
    getTransactions: builder.query<WalletTransactionsResponse, { limit?: number; offset?: number }>({
      query: ({ limit = 50, offset = 0 }) => ({
        url: 'wallet/transactions',
        params: { limit, offset },
      }),
      providesTags: ['Transaction'],
    }),
    addCredits: builder.mutation<any, AddCreditsRequest>({
      query: (data) => ({
        url: 'wallet/add-credits',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'Transaction'],
    }),
    convertCredits: builder.mutation<ConvertCreditsResponse, ConvertCreditsRequest>({
      query: (data) => ({
        url: 'wallet/convert',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'Transaction'],
    }),
  }),
})

export const {
  useGetWalletQuery,
  useGetTransactionsQuery,
  useAddCreditsMutation,
  useConvertCreditsMutation,
} = walletApi
