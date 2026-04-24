import { createApi } from '@reduxjs/toolkit/query/react'

import { baseApiConfig } from './baseApi'



export interface Project {

  project_id: string

  id?: string // alias used by some components

  name?: string

  total_price: number

  timeline_days: number

  client_id?: string

  employer_id?: string

  freelancer_id?: string

  status?: string

  created_at?: string

  updated_at?: string

  brief?: ProjectBrief

  contract?: any

  repo_link?: string

  description?: string

  escrow_balance?: number

}



export interface ProjectBrief {

  id: string

  raw_text: string

  domain: string

  project_id: string

  created_at: string

}



export interface CreateProjectRequest {

  total_price: number

  timeline_days: number

  client_id?: string

}



export interface AddProjectBriefRequest {

  raw_text: string

  domain: 'code' | 'design' | 'content' | 'general' | string

  client_brief?: string // legacy alias

}



export interface VerificationContract {

  contract_id: string

  policy: string

  verification_contract_id: string

  project_id: string

  generated_from_sop_version: number

  freelancer_approved: number

  client_approved: number

  locked_at: number

  created_at: string

  isLocked: number

}



export interface UserProfile {

  user_id: string

  email: string

  role: 'employer' | 'freelancer'

  pfi_score: number

  trust_score: number

  pfi_history: any

  grace_period_active: number

  created_at: string

  stripe_account_id: string | null

  razorpay_account_id: string | null

  github_token: string | null

}



export interface UpdateUserProfileRequest {

  stripe_account_id?: string

  razorpay_account_id?: string

  github_token?: string

}



export interface GenerateSOPRequest {

  project_id: string

  raw_text: string

  domain: string

  timeline_days: number

}



export interface SOP {

  sop_id: string

  project_id: string

  version: number

  content_html: string

  freelancer_approved: number

  client_approved: number

  locked_at: string | null

  edit_history: any

  price_set: any

  created_at: string

}



export interface Milestone {

  milestone_id: string

  project_id: string

  title: string

  deadline: string

  payment_amount: number

  status: string

  revisions_used: number

  max_revisions: number

  created_at: string

  sop_id?: string

}



export interface MilestoneSubmission {

  submission_id: string

  project_id: string

  milestone_id: string

  type: 'code' | 'design' | 'documentation' | 'other'

  status: 'submitted' | 'reviewing' | 'approved' | 'rejected'

  repo_url?: string

  content?: string

  submitted_at?: string

  created_at: string

}



export interface CreateSubmissionRequest {

  type: 'code' | 'design' | 'documentation' | 'other'

  repo_url?: string

  content?: string

}



export interface Dispute {
  dispute_id: string
  project_id: string
  raised_by: string
  dispute_type: string
  description: string
  status: 'open' | 'under_review' | 'resolved' | 'closed'
  resolution?: string
  resolved_by?: string
  milestone_id?: string
  created_at: string
  resolved_at?: string
  updated_at: string
}

export interface CreateDisputeRequest {
  project_id: string
  dispute_type: string
  description: string
  milestone_id?: string
}

export interface AQAResponse {

  aqa_id: string

  submission_id: string

  milestone_id: string

  verdict: 'passed' | 'failed'

  pass_rate: number

  payment_trigger: 'none' | 'partial' | 'full'

  audit_report: {

    aqa_id: string

    summary: string

    passed_checks: any[]

    failed_checks: any[]

    missing_items: string[]

    comparison_table: any[]

  }

  all_checks: any[]

  milestone_amount: number

  execution_time_ms: number

  ai_model_used: string | null

  error_message: string | null

  aqa_version: string

  created_at: string

  payment_status: 'pending' | 'paid' | 'failed'

}



export const projectsApi = createApi({

  ...baseApiConfig,

  reducerPath: 'projectsApi',
  tagTypes: ['Project', 'Brief', 'Contract', 'User', 'SOP', 'Milestone', 'MilestoneSubmission', 'MilestoneChecks', 'Dispute'],
  endpoints: (builder) => ({

    getProjects: builder.query<Project[], void>({

      query: () => '/projects',

      providesTags: ['Project'],

      transformResponse: (response: Project[]) => {

        console.log('Projects API Response:', response)

        return response

      },

    }),

    getProject: builder.query<Project, string>({

      query: (id) => `/projects/${id}`,

      providesTags: (result, error, id) => [{ type: 'Project', id }],

    }),

    createProject: builder.mutation<Project, CreateProjectRequest>({

      query: (project) => ({

        url: '/projects',

        method: 'POST',

        body: project,

      }),

      invalidatesTags: ['Project'],

      transformErrorResponse: (error) => {

        console.error('Create Project Error:', error)

        return error

      },

    }),

    addProjectBrief: builder.mutation<ProjectBrief, { projectId: string; data: AddProjectBriefRequest }>({

      query: ({ projectId, data }) => ({

        url: `/projects/${projectId}/brief`,

        method: 'POST',

        body: data,

      }),

      invalidatesTags: (result, error, { projectId }) => [{ type: 'Project', id: projectId }],

    }),

    getVerificationContract: builder.query<VerificationContract, string>({

      query: (projectId) => `/projects/${projectId}/verification-contract`,

      providesTags: ['Contract'],

    }),

    approveClientContract: builder.mutation<void, string>({

      query: (verificationContractId) => ({

        url: `/projects/verification-contract/${verificationContractId}/approve-client`,

        method: 'POST',

      }),

      invalidatesTags: ['Contract'],

    }),

    approveFreelancerContract: builder.mutation<void, string>({

      query: (verificationContractId) => ({

        url: `/projects/verification-contract/${verificationContractId}/approve-freelancer`,

        method: 'POST',

      }),

      invalidatesTags: ['Contract'],

    }),

    getUserProfile: builder.query<UserProfile, void>({

      query: () => '/users/profile',

      providesTags: ['User'],

    }),

    updateUserProfile: builder.mutation<UserProfile, UpdateUserProfileRequest>({

      query: (data) => ({

        url: '/users/profile',

        method: 'PUT',

        body: data,

      }),

      invalidatesTags: ['User'],

    }),

    generateSOP: builder.mutation<{ sop_id: string }, GenerateSOPRequest>({

      query: (data) => ({

        url: '/sops/generate',

        method: 'POST',

        body: data,

      }),

      invalidatesTags: ['SOP'],

    }),

    getSOP: builder.query<SOP, string>({

      query: (sopId) => `/sops/${sopId}`,

      providesTags: ['SOP'],

    }),

    getProjectSOPs: builder.query<SOP[], string>({

      query: (projectId) => `/sops/project/${projectId}`,

      providesTags: ['SOP'],

    }),

    getSOPMilestones: builder.query<Milestone[], string>({

      query: (sopId) => `/sops/${sopId}/milestones`,

      providesTags: ['SOP'],

    }),

    getProjectMilestones: builder.query<Milestone[], string>({

      query: (projectId) => `/projects/${projectId}/milestones`,

      providesTags: ['Milestone'],

    }),

    submitMilestone: builder.mutation<{ submission: MilestoneSubmission }, { projectId: string; milestoneId: string; data: CreateSubmissionRequest }>({

      query: ({ projectId, milestoneId, data }) => ({

        url: `/projects/${projectId}/milestones/${milestoneId}/submissions`,

        method: 'POST',

        body: data,

      }),

      invalidatesTags: ['MilestoneSubmission'],

      transformErrorResponse: (error) => {

        console.error('Submit Milestone Error:', error)

        return error

      },

    }),

    runAQAs: builder.mutation<AQAResponse, string>({

      query: (submissionId) => ({

        url: `/submissions/${submissionId}/run-aqa`,

        method: 'POST',

      }),

      invalidatesTags: ['MilestoneSubmission'],

      transformErrorResponse: (error) => {

        console.error('Run AQAs Error:', error)

        return error

      },

    }),

    approveSOP: builder.mutation<SOP, string>({

      query: (sopId) => ({

        url: `/sops/${sopId}/approve`,

        method: 'POST',

      }),

      invalidatesTags: ['SOP', 'Project'],

    }),

    createDispute: builder.mutation<Dispute, CreateDisputeRequest>({

      query: (data) => ({

        url: '/disputes',

        method: 'POST',

        body: data,

      }),

      invalidatesTags: ['Dispute', 'Project'],

    }),

    getMyDisputes: builder.query<Dispute[], void>({

      query: () => '/disputes/mine',

      providesTags: ['Dispute'],

    }),

    getProjectDisputes: builder.query<Dispute[], string>({

      query: (projectId) => `/disputes/project/${projectId}`,

      providesTags: ['Dispute'],

    }),

    resolveDispute: builder.mutation<Dispute, { disputeId: string; resolution: string }>({

      query: ({ disputeId, resolution }) => ({

        url: `/disputes/${disputeId}/resolve`,

        method: 'PUT',

        body: { resolution },

      }),

      invalidatesTags: ['Dispute', 'Project'],

    }),

  }),

})



export const {

  useGetProjectsQuery,

  useGetProjectQuery,

  useCreateProjectMutation,

  useAddProjectBriefMutation,

  useGetVerificationContractQuery,

  useApproveClientContractMutation,

  useApproveFreelancerContractMutation,

  useGetUserProfileQuery,

  useUpdateUserProfileMutation,

  useGenerateSOPMutation,

  useGetSOPQuery,

  useGetProjectSOPsQuery,

  useGetSOPMilestonesQuery,

  useGetProjectMilestonesQuery,

  useSubmitMilestoneMutation,

  useRunAQAsMutation,

  useApproveSOPMutation,

  useCreateDisputeMutation,

  useGetMyDisputesQuery,

  useGetProjectDisputesQuery,

  useResolveDisputeMutation,

} = projectsApi

