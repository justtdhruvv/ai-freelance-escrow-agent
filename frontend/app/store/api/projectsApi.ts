import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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
  raw_text: string
  domain: string
}

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
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
  tagTypes: ['Project', 'Brief'],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => '/projects',
      providesTags: ['Project'],
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
