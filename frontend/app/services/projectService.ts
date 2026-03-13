// Project API Service
// Handles all CRUD operations for projects

const API_BASE_URL = 'http://localhost:3001'

export interface Project {
  id: string
  title: string
  description: string
  clientEmail: string  // Client email instead of client ID
  budget: number
  status: 'active' | 'completed' | 'review' | 'disputed'
  deadline: string
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  amount: number
  status: 'pending' | 'active' | 'completed' | 'approved'
  dueDate: string
}

export interface CreateProjectData {
  title: string
  clientEmail: string  // Client email instead of ID
  description: string
  budget: number
  deadline: string
}

export interface UpdateProjectData {
  title?: string
  clientEmail?: string
  description?: string
  budget?: number
  status?: 'active' | 'completed' | 'review' | 'disputed'
  deadline?: string
}

class ProjectService {
  // GET all projects
  async getProjects(): Promise<Project[]> {
    try {
      // Since there's no backend API, return mock data directly
      return [
        {
          id: '1',
          title: 'E-commerce Platform',
          clientEmail: 'client1@gmail.com',
          description: 'Build a modern e-commerce platform with React and Node.js',
          budget: 5000,
          status: 'active',
          deadline: '2024-03-15',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10'
        },
        {
          id: '2',
          title: 'Mobile App UI Design',
          clientEmail: 'client2@gmail.com',
          description: 'Design modern mobile app interface',
          budget: 3500,
          status: 'review',
          deadline: '2024-02-28',
          createdAt: '2024-01-05',
          updatedAt: '2024-01-25'
        },
        {
          id: '3',
          title: 'Website Redesign',
          clientEmail: 'client3@gmail.com',
          description: 'Complete redesign of company website',
          budget: 2500,
          status: 'completed',
          deadline: '2024-01-30',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-28'
        }
      ]
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  // GET single project
  async getProject(id: string): Promise<Project> {
    try {
      const projects = await this.getProjects()
      const project = projects.find(p => p.id === id)
      if (!project) {
        throw new Error('Project not found')
      }
      return project
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  }

  // POST create new project
  async createProject(data: CreateProjectData): Promise<Project> {
    try {
      // Since there's no backend API, return mock project
      console.log('Creating project with data:', data)
      return {
        id: Date.now().toString(),
        title: data.title,
        clientEmail: data.clientEmail,
        description: data.description,
        budget: data.budget,
        status: 'active' as const,
        deadline: data.deadline,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  // PUT update project
  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    try {
      // Since there's no backend API, return mock updated project
      console.log('Updating project with id:', id, 'data:', data)
      const existingProject = await this.getProjects().then(projects => projects.find(p => p.id === id))
      if (!existingProject) {
        throw new Error('Project not found')
      }
      
      return {
        ...existingProject,
        ...data,
        updatedAt: new Date().toISOString().split('T')[0]
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  // DELETE project
  async deleteProject(id: string): Promise<void> {
    try {
      // Since there's no backend API, just log deletion
      console.log('Deleting project with id:', id)
      // In a real API, you would make a DELETE request
      // const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      //   method: 'DELETE',
      // })
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`)
      // }
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService()
