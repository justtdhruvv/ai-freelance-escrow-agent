import { createApi } from '@reduxjs/toolkit/query/react'
import { baseApiConfig } from './baseApi'

export interface VerificationContract {
  id: string
  project_id: string
  client_approved: boolean
  freelancer_approved: boolean
  locked: boolean
  created_at: string
  updated_at: string
}

export interface CreateContractRequest {
  // Empty body as per API spec
}

export const contractApi = createApi({
  ...baseApiConfig,
  reducerPath: 'contractApi',
  tagTypes: ['Contract'],
  endpoints: (builder) => ({
    createContract: builder.mutation<VerificationContract, { projectId: string }>({
      query: ({ projectId }) => ({
        url: `/projects/${projectId}/verification-contract`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Contract'],
      transformErrorResponse: (error) => {
        console.error('Create Contract Error:', error)
        return error
      },
    }),
    approveClient: builder.mutation<VerificationContract, string>({
      query: (contractId) => ({
        url: `/verification-contract/${contractId}/approve-client`,
        method: 'POST',
      }),
      invalidatesTags: ['Contract'],
    }),
    approveFreelancer: builder.mutation<VerificationContract, string>({
      query: (contractId) => ({
        url: `/verification-contract/${contractId}/approve-freelancer`,
        method: 'POST',
      }),
      invalidatesTags: ['Contract'],
    }),
    lockContract: builder.mutation<VerificationContract, string>({
      query: (contractId) => ({
        url: `/verification-contract/${contractId}/lock`,
        method: 'POST',
      }),
      invalidatesTags: ['Contract'],
    }),
    getContract: builder.query<VerificationContract, string>({
      query: (projectId) => `/projects/${projectId}/verification-contract`,
      providesTags: (result, error, projectId) => [{ type: 'Contract', id: projectId }],
    }),
  }),
})

export const {
  useCreateContractMutation,
  useApproveClientMutation,
  useApproveFreelancerMutation,
  useLockContractMutation,
  useGetContractQuery,
} = contractApi
