export interface Project {
  id: string
  title: string
  clientEmail: string
  freelancer: string
  totalEscrowAmount: number
  milestones: number
  status: 'active' | 'completed' | 'review' | 'disputed'
  progress: number
  description?: string
  deadline?: string
  startDate?: string
  budget?: number
  riskScore?: number
  client_id?: string
  freelancer_id?: string
  created_at?: string
  updated_at?: string
}

export interface CreateProjectData {
  title: string
  description: string
  budget: number
  timeline_days?: number
  freelancer_id?: string
}

export interface UpdateProjectData {
  title?: string
  description?: string
  budget?: number
  status?: string
  progress?: number
  freelancer_id?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

const API_BASE_URL = "http://localhost:3000/projects"

class ProjectService {

  private getToken(): string | null {
    return localStorage.getItem("authToken")
  }

  private getUserId(): string | null {
    return localStorage.getItem("userId")
  }

  private async handleRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || 
        errorData.error || 
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    return await response.json()
  }

  async getProjects(): Promise<Project[]> {
    try {
      const response = await this.handleRequest<Project[]>(API_BASE_URL)
      return response || []
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      throw error
    }
  }

  async getProjectById(id: string): Promise<Project> {
    try {
      const response = await this.handleRequest<Project>(`${API_BASE_URL}/${id}`)
      return response
    } catch (error) {
      console.error(`Failed to fetch project ${id}:`, error)
      throw error
    }
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    try {
      const userId = this.getUserId()
      
      if (!userId) {
        throw new Error('User not authenticated. Please login again.')
      }
      
      const payload = {
        client_id: userId,
        title: data.title,
        description: data.description,
        total_price: data.budget,
        timeline_days: data.timeline_days || 14,
        freelancer_id: data.freelancer_id
      }

      const response = await this.handleRequest<Project>(API_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      
      return response
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    try {
      const response = await this.handleRequest<Project>(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      
      return response
    } catch (error) {
      console.error(`Failed to update project ${id}:`, error)
      throw error
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.handleRequest<void>(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error)
      throw error
    }
  }

  async getProjectsByClient(clientId: string): Promise<Project[]> {
    try {
      const response = await this.handleRequest<Project[]>(
        `${API_BASE_URL}?client_id=${clientId}`
      )
      return response || []
    } catch (error) {
      console.error(`Failed to fetch projects for client ${clientId}:`, error)
      throw error
    }
  }

  async getProjectsByFreelancer(freelancerId: string): Promise<Project[]> {
    try {
      const response = await this.handleRequest<Project[]>(
        `${API_BASE_URL}?freelancer_id=${freelancerId}`
      )
      return response || []
    } catch (error) {
      console.error(`Failed to fetch projects for freelancer ${freelancerId}:`, error)
      throw error
    }
  }

  async updateProjectStatus(id: string, status: string): Promise<Project> {
    try {
      const response = await this.handleRequest<Project>(
        `${API_BASE_URL}/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      )
      
      return response
    } catch (error) {
      console.error(`Failed to update project status ${id}:`, error)
      throw error
    }
  }

  async updateProjectProgress(id: string, progress: number): Promise<Project> {
    try {
      const response = await this.handleRequest<Project>(
        `${API_BASE_URL}/${id}/progress`,
        {
          method: 'PATCH',
          body: JSON.stringify({ progress }),
        }
      )
      
      return response
    } catch (error) {
      console.error(`Failed to update project progress ${id}:`, error)
      throw error
    }
  }

}

export const projectService = new ProjectService()