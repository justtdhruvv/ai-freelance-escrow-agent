import { createApi } from '@reduxjs/toolkit/query/react'
import { baseApiConfig } from './baseApi'

export interface RazorpayKeyResponse {
  key_id: string
  key: string
  created_at: string
}

export interface CreateEscrowRequest {
  projectId: string
  amount: number
  description?: string
}

export interface ConfirmPaymentRequest {
  order_id: string
  payment_id: string
  razorpay_signature: string
}

export interface ReleasePaymentRequest {
  milestoneId: string
  amount?: number
  description?: string
}

export interface ProratedReleaseRequest {
  milestoneId: string
  passRate: number
  description?: string
}

export interface PaymentTransaction {
  transaction_id: string
  type: 'escrow_hold' | 'payment_release' | 'conversion' | 'refund'
  amount: number
  description: string
  status: string
  created_at: string
  project_id?: string
  milestone_id?: string
}

export interface PaymentResponse {
  success: boolean
  data: any
  message?: string
}

export const paymentApi = createApi({
  ...baseApiConfig,
  reducerPath: 'paymentApi',
  tagTypes: ['Payment', 'Transaction', 'Project', 'Milestone'],
  endpoints: (builder) => ({
    // Get Razorpay key for frontend
    getRazorpayKey: builder.query<RazorpayKeyResponse, void>({
      query: () => 'payments/key',
      providesTags: ['Payment'],
    }),
    
    // Create escrow hold for project
    createEscrow: builder.mutation<PaymentResponse, CreateEscrowRequest>({
      query: (data) => ({
        url: `payments/projects/${data.projectId}/escrow`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment', 'Transaction', 'Project'],
    }),
    
    // Confirm payment after Razorpay success
    confirmPayment: builder.mutation<PaymentResponse, ConfirmPaymentRequest>({
      query: (data) => ({
        url: 'payments/confirm',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment', 'Transaction', 'Project'],
    }),
    
    // Release full milestone payment
    releasePayment: builder.mutation<PaymentResponse, ReleasePaymentRequest>({
      query: (data) => ({
        url: `milestones/${data.milestoneId}/release`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment', 'Transaction', 'Milestone'],
    }),
    
    // Release prorated milestone payment (partial)
    releaseProratedPayment: builder.mutation<PaymentResponse, ProratedReleaseRequest>({
      query: (data) => ({
        url: `milestones/${data.milestoneId}/release-prorated`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment', 'Transaction', 'Milestone'],
    }),
    
    // Get payment events for a project
    getProjectPaymentEvents: builder.query<PaymentTransaction[], { projectId: string; limit?: number; offset?: number }>({
      query: ({ projectId, limit, offset }) => ({
        url: `payments/projects/${projectId}/payment-events`,
        params: { limit, offset },
      }),
      providesTags: ['Payment', 'Transaction'],
    }),
  }),
})

export const {
  useGetRazorpayKeyQuery,
  useCreateEscrowMutation,
  useConfirmPaymentMutation,
  useReleasePaymentMutation,
  useReleaseProratedPaymentMutation,
  useGetProjectPaymentEventsQuery,
} = paymentApi
