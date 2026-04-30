import { createApi } from '@reduxjs/toolkit/query/react'
import { baseApiConfig } from './baseApi'

export interface FundProjectResponse {
  success: boolean
  message: string
  payment_event_id: string
  amount: number
  project_id: string
}

export interface ReleasePaymentRequest {
  milestoneId: string
  triggered_by?: 'aqa_auto' | 'manual' | 'dispute_resolution'
}

export interface ProratedReleaseRequest {
  milestoneId: string
  passRate: number
}

export interface PaymentTransaction {
  transaction_id: string
  type: 'escrow_hold' | 'milestone_release' | 'prorated_release' | 'refund'
  amount: number
  description?: string
  status?: string
  created_at: string
  project_id?: string
  milestone_id?: string
}

export interface StripeCheckoutResponse {
  url: string
}

export interface StripeVerifyResponse {
  success: boolean
  payment_event: any
}

export const paymentApi = createApi({
  ...baseApiConfig,
  reducerPath: 'paymentApi',
  tagTypes: ['Payment', 'Transaction', 'Project', 'Milestone'],
  endpoints: (builder) => ({
    // Simulate client funding the project into escrow (no payment gateway)
    fundProject: builder.mutation<FundProjectResponse, { projectId: string }>({
      query: ({ projectId }) => ({
        url: `payments/projects/${projectId}/fund`,
        method: 'POST',
      }),
      invalidatesTags: ['Payment', 'Transaction', 'Project'],
    }),

    // Create a Stripe Checkout session — returns hosted payment URL
    createStripeCheckoutSession: builder.mutation<StripeCheckoutResponse, { projectId: string }>({
      query: ({ projectId }) => ({
        url: 'payments/stripe/create-checkout-session',
        method: 'POST',
        body: { projectId },
      }),
    }),

    // Verify Stripe payment on return and credit project escrow
    verifyStripeSession: builder.mutation<StripeVerifyResponse, { sessionId: string; projectId: string }>({
      query: ({ sessionId, projectId }) => ({
        url: 'payments/stripe/verify-session',
        method: 'POST',
        body: { sessionId, projectId },
      }),
      invalidatesTags: ['Payment', 'Transaction', 'Project'],
    }),

    // Release full milestone payment to freelancer
    releasePayment: builder.mutation<any, ReleasePaymentRequest>({
      query: ({ milestoneId, triggered_by }) => ({
        url: `payments/milestones/${milestoneId}/release`,
        method: 'POST',
        body: { triggered_by: triggered_by || 'manual' },
      }),
      invalidatesTags: ['Payment', 'Transaction', 'Milestone'],
    }),

    // Release prorated milestone payment (partial AQA pass)
    releaseProratedPayment: builder.mutation<any, ProratedReleaseRequest>({
      query: ({ milestoneId, passRate }) => ({
        url: `payments/milestones/${milestoneId}/release-prorated`,
        method: 'POST',
        body: { passRate },
      }),
      invalidatesTags: ['Payment', 'Transaction', 'Milestone'],
    }),

    // Get payment history for a project
    getProjectPaymentEvents: builder.query<{ payment_events: PaymentTransaction[]; count: number }, string>({
      query: (projectId) => `payments/projects/${projectId}/payment-events`,
      providesTags: ['Payment', 'Transaction'],
    }),
  }),
})

export const {
  useFundProjectMutation,
  useCreateStripeCheckoutSessionMutation,
  useVerifyStripeSessionMutation,
  useReleasePaymentMutation,
  useReleaseProratedPaymentMutation,
  useGetProjectPaymentEventsQuery,
} = paymentApi
