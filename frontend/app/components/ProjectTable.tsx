'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import ProjectRow from './ProjectRow'

interface Project {
  id: string
  name: string
  client: string
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
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'AI SaaS Dashboard',
    client: 'TechCorp',
    freelancer: 'Sarah Chen',
    totalEscrowAmount: 12500,
    milestones: 4,
    status: 'active',
    progress: 65,
    description: 'Complete AI-powered SaaS dashboard with analytics',
    deadline: '2024-03-15',
    startDate: '2024-01-15',
    budget: 15000,
    riskScore: 25
  },
  {
    id: '2',
    name: 'Mobile App Redesign',
    client: 'StartupHub',
    freelancer: 'Mike Johnson',
    totalEscrowAmount: 8200,
    milestones: 3,
    status: 'active',
    progress: 40,
    description: 'Complete mobile app UI/UX redesign',
    deadline: '2024-02-28',
    startDate: '2024-01-01',
    budget: 10000,
    riskScore: 15
  },
  {
    id: '3',
    name: 'E-commerce Platform',
    client: 'RetailMax',
    freelancer: 'Emily Davis',
    totalEscrowAmount: 15000,
    milestones: 5,
    status: 'review',
    progress: 90,
    description: 'Full-stack e-commerce platform development',
    deadline: '2024-02-10',
    startDate: '2023-11-15',
    budget: 20000,
    riskScore: 35
  },
  {
    id: '4',
    name: 'API Integration',
    client: 'CloudTech',
    freelancer: 'Alex Rivera',
    totalEscrowAmount: 4800,
    milestones: 2,
    status: 'completed',
    progress: 100,
    description: 'Third-party API integration services',
    deadline: '2024-01-20',
    startDate: '2023-12-01',
    budget: 5000,
    riskScore: 10
  },
  {
    id: '5',
    name: 'Data Analytics Dashboard',
    client: 'FinanceFlow',
    freelancer: 'Lisa Wang',
    totalEscrowAmount: 12000,
    milestones: 4,
    status: 'active',
    progress: 75,
    description: 'Real-time data analytics dashboard',
    deadline: '2024-03-01',
    startDate: '2023-12-15',
    budget: 14000,
    riskScore: 20
  },
  {
    id: '6',
    name: 'Blockchain Wallet',
    client: 'CryptoBase',
    freelancer: 'David Kim',
    totalEscrowAmount: 18000,
    milestones: 6,
    status: 'disputed',
    progress: 55,
    description: 'Secure blockchain wallet development',
    deadline: '2024-04-01',
    startDate: '2023-12-01',
    budget: 25000,
    riskScore: 65
  },
  {
    id: '7',
    name: 'Content Management System',
    client: 'MediaCorp',
    freelancer: 'Rachel Green',
    totalEscrowAmount: 9500,
    milestones: 3,
    status: 'active',
    progress: 30,
    description: 'Custom CMS for media company',
    deadline: '2024-03-20',
    startDate: '2024-01-10',
    budget: 12000,
    riskScore: 18
  },
  {
    id: '8',
    name: 'Machine Learning Model',
    client: 'DataTech AI',
    freelancer: 'James Wilson',
    totalEscrowAmount: 22000,
    milestones: 5,
    status: 'review',
    progress: 95,
    description: 'Predictive analytics ML model',
    deadline: '2024-02-15',
    startDate: '2023-11-01',
    budget: 30000,
    riskScore: 40
  }
]

interface ProjectTableProps {
  searchTerm: string
  filterStatus: string
  onViewProject: (project: Project) => void
  onEditProject: (project: Project) => void
  onViewMilestones: (project: Project) => void
  onFundEscrow: (project: Project) => void
  onReleasePayment: (project: Project) => void
  onOpenDispute: (project: Project) => void
  onMessageFreelancer: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export default function ProjectTable({
  searchTerm,
  filterStatus,
  onViewProject,
  onEditProject,
  onViewMilestones,
  onFundEscrow,
  onReleasePayment,
  onOpenDispute,
  onMessageFreelancer,
  onDeleteProject
}: ProjectTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredProjects = useMemo(() => {
    return mockProjects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.freelancer.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterStatus === 'all' || project.status === filterStatus
      
      return matchesSearch && matchesFilter
    })
  }, [searchTerm, filterStatus])

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Project Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Freelancer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Total Escrow Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Milestones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedProjects.map((project, index) => (
              <ProjectRow
                key={project.id}
                project={project}
                index={index}
                onViewProject={onViewProject}
                onEditProject={onEditProject}
                onViewMilestones={onViewMilestones}
                onFundEscrow={onFundEscrow}
                onReleasePayment={onReleasePayment}
                onOpenDispute={onOpenDispute}
                onMessageFreelancer={onMessageFreelancer}
                onDeleteProject={onDeleteProject}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found matching your criteria.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
              whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <motion.button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#AD7D56] text-white'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {page}
              </motion.button>
            ))}
            
            <motion.button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
              whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
