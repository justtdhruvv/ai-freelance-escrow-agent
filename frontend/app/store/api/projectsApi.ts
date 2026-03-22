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

export const projectsApi = createApi({
  ...baseApiConfig,
  reducerPath: 'projectsApi',
  tagTypes: ['Project', 'Brief'],
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
  }),
})

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useAddProjectBriefMutation,
} = projectsApi
