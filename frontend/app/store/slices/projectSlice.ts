import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  searchTerm: string
  filterStatus: string
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  searchTerm: '',
  filterStatus: 'all',
}

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload
      state.isLoading = false
      state.error = null
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.unshift(action.payload)
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.projects[index] = action.payload
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload)
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    setFilterStatus: (state, action: PayloadAction<string>) => {
      state.filterStatus = action.payload
    },
    addProjectBrief: (state, action: PayloadAction<{ projectId: string; brief: ProjectBrief }>) => {
      const { projectId, brief } = action.payload
      const projectIndex = state.projects.findIndex(p => p.id === projectId)
      if (projectIndex !== -1) {
        state.projects[projectIndex].brief = brief
      }
      if (state.currentProject?.id === projectId) {
        state.currentProject.brief = brief
      }
    },
  },
})

export const {
  setProjects,
  setCurrentProject,
  addProject,
  updateProject,
  deleteProject,
  setLoading,
  setError,
  setSearchTerm,
  setFilterStatus,
  addProjectBrief,
} = projectSlice.actions

export default projectSlice.reducer
