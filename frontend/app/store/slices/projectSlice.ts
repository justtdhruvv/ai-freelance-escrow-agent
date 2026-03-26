import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Project, ProjectBrief } from '../../../types/project'

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
      const index = state.projects.findIndex(p => p.project_id === action.payload.project_id)
      if (index !== -1) {
        state.projects[index] = action.payload
      }
      if (state.currentProject?.project_id === action.payload.project_id) {
        state.currentProject = action.payload
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p.project_id !== action.payload)
      if (state.currentProject?.project_id === action.payload) {
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
      const projectIndex = state.projects.findIndex(p => p.project_id === projectId)
      if (projectIndex !== -1) {
        state.projects[projectIndex].brief = brief
      }
      if (state.currentProject?.project_id === projectId) {
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
