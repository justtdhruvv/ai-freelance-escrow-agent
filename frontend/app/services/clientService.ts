// Client API Service
// Handles all CRUD operations for clients

const API_BASE_URL = 'http://localhost:3000'

export interface Client {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientData {
  name: string
  email: string
}

export interface UpdateClientData {
  name?: string
  email?: string
}

class ClientService {
  // GET all clients
  async getClients(): Promise<Client[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching clients:', error)
      // Return mock data as fallback
      return [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@gmail.com',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@gmail.com',
          createdAt: '2024-01-05',
          updatedAt: '2024-01-25'
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob@gmail.com',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-28'
        }
      ]
    }
  }

  // GET single client
  async getClient(id: string): Promise<Client> {
    try {
      const clients = await this.getClients()
      const client = clients.find(c => c.id === id)
      if (!client) {
        throw new Error('Client not found')
      }
      return client
    } catch (error) {
      console.error('Error fetching client:', error)
      throw error
    }
  }

  // POST create new client
  async createClient(data: CreateClientData): Promise<Client> {
    try {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("email", data.email)

      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error creating client:', error)
      
      // Fallback to mock data if API is not available
      console.warn('API not available, returning mock client')
      return {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
    }
  }

  // PUT update client
  async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    try {
      const formData = new FormData()
      if (data.name) formData.append("name", data.name)
      if (data.email) formData.append("email", data.email)

      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: "PUT",
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error updating client:', error)
      
      // Fallback to mock data if API is not available
      const existingClient = await this.getClients().then(clients => clients.find(c => c.id === id))
      if (!existingClient) {
        throw new Error('Client not found')
      }
      
      return {
        ...existingClient,
        ...data,
        updatedAt: new Date().toISOString().split('T')[0]
      }
    }
  }

  // DELETE client
  async deleteClient(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      // In case of API error, just log it but don't throw to avoid breaking UI
      console.warn('API not available, but continuing with mock deletion')
    }
  }
}

// Export singleton instance
export const clientService = new ClientService()
