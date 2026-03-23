import { createApi } from '@reduxjs/toolkit/query/react'
import { baseApiConfig } from './baseApi'

export interface Project {
  id: string
  total_price: number
  timeline_days: number
  client_id?: string
  status?: string
  created_at?: string
  updated_at?: string
  brief?: ProjectBrief
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
  client_brief: string
  domain: 'code' | 'design' | 'content' | 'general'
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
  // Add other profile fields as needed
}

export const projectsApi = createApi({
  ...baseApiConfig,
  reducerPath: 'projectsApi',
  tagTypes: ['Project', 'Brief', 'Contract', 'User'],
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
} = projectsApi
