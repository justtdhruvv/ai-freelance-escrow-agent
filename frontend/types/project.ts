export type ProjectStatus = 'draft' | 'active' | 'completed' | 'review' | 'disputed'

export interface ProjectBrief {
  id: string
  brief_id?: string
  project_id: string
  raw_text: string
  domain: string
  ai_processed?: number
  created_at: string
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
  locked?: boolean
}

export interface Project {
  // Core fields from API
  project_id: string
  employer_id: string
  freelancer_id: string
  status: ProjectStatus
  total_price: number
  timeline_days: number
  created_at: string
  updated_at?: string
  repo_link?: string
  name?: string
  client_id?: string
  brief?: ProjectBrief
  contract?: VerificationContract
  
  // Additional fields for UI components
  riskScore?: number
  totalEscrowAmount?: number
  milestones?: number
  progress?: number
  description?: string
  deadline?: string
  startDate?: string
  budget?: number
}

// API response types for different formats
export type ProjectsApiResponse = Project[] | { projects: Project[] }
