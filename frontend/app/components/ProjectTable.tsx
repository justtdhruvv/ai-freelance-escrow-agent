'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, FileText } from 'lucide-react'
import ProjectRow from './ProjectRow'
import CreateProjectBriefModal from './CreateProjectBriefModal'
import ViewProjectBriefModal from './ViewProjectBriefModal'
import ContractModal from './ContractModal'
import SOPModal from './SOPModal'
import { useMemo, useState } from 'react'
import { useGetProjectsQuery } from '../store/api/projectsApi'
import { useGetClientsQuery } from '../store/api/clientsApi'

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
  onDeleteProject,
  onCreateProject
}: any) {

  const [currentPage, setCurrentPage] = useState(1)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [showViewBriefModal, setShowViewBriefModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showSOPModal, setShowSOPModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const itemsPerPage = 5

  // API
  const { data, isLoading, isError } = useGetProjectsQuery()
  const { data: clientsData } = useGetClientsQuery()

  const projects = data?.projects || data || []
  const clients = clientsData?.clients || []

  // Create client ID to email mapping
  const clientMap = useMemo(() => {
    const map: Record<string, string> = {}
    clients.forEach((client: any) => {
      map[client.user_id] = client.email
    })
    return map
  }, [clients])

  // Filter
  const filteredProjects = useMemo(() => {
    return projects.filter((project: any) => {

      const clientEmail = clientMap[project.employer_id] || ''
      const matchesSearch =
        project.project_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientEmail?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter =
        filterStatus === 'all' || project.status === filterStatus

      return matchesSearch && matchesFilter
    })
  }, [projects, searchTerm, filterStatus, clientMap])

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjects = filteredProjects.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleAddProjectBrief = (project: any) => {
    setSelectedProject(project)
    setShowBriefModal(true)
  }

  const handleViewProjectBrief = (project: any) => {
    setSelectedProject(project)
    setShowViewBriefModal(true)
  }

  const handleViewContract = (project: any) => {
    setSelectedProject(project)
    setShowContractModal(true)
  }

  const handleCreateSOP = (project: any) => {
    setSelectedProject(project)
    setShowSOPModal(true)
  }

  const handleCloseBriefModal = () => {
    setShowBriefModal(false)
    setSelectedProject(null)
  }

  const handleCloseViewBriefModal = () => {
    setShowViewBriefModal(false)
    setSelectedProject(null)
  }

  const handleCloseContractModal = () => {
    setShowContractModal(false)
    setSelectedProject(null)
  }

  const handleCloseSOPModal = () => {
    setShowSOPModal(false)
    setSelectedProject(null)
  }

  const handleBriefSuccess = () => {
    // Refetch projects to update the table
    window.location.reload()
  }

  // Pagination numbers logic
  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)

      if (currentPage > 3) pages.push("...")

      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        if (i > 1 && i < totalPages) pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push("...")

      pages.push(totalPages)
    }

    return pages
  }

  // Loading
  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading projects...</div>
  }

  // Error
  if (isError) {
    return <div className="p-6 text-red-500">Failed to load projects</div>
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">

          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Timeline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {paginatedProjects.map((project: any, index: number) => (
              <ProjectRow
                key={project.project_id || index}
                project={project}
                index={index}
                clientEmail={clientMap[project.employer_id] || 'Unknown Client'}
                onAddProjectBrief={handleAddProjectBrief}
                onViewProjectBrief={handleViewProjectBrief}
                onViewContract={handleViewContract}
                onCreateSOP={handleCreateSOP}
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

      {/* Empty */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          No projects found 🚀
        </div>
      )}

      {/* Header with Create Project button */}
      {/* <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <button
          onClick={onCreateProject}
          className="px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div> */}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-6">

          {/* Prev */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Numbers */}
          {getPageNumbers().map((page, i) =>
            page === "..." ? (
              <span key={i} className="px-2 text-gray-400">...</span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all
                  ${
                    currentPage === page
                      ? 'bg-[#AD7D56] text-white shadow-md'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {page}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* Project Brief Modal */}
      {showBriefModal && selectedProject && (
        <CreateProjectBriefModal
          onClose={handleCloseBriefModal}
          onSuccess={handleBriefSuccess}
          projectId={selectedProject.project_id}
        />
      )}

      {/* View Project Brief Modal */}
      {showViewBriefModal && selectedProject && (
        <ViewProjectBriefModal
          onClose={handleCloseViewBriefModal}
          projectId={selectedProject.project_id}
        />
      )}

      {/* Contract Modal */}
      {showContractModal && selectedProject && (
        <ContractModal
          onClose={handleCloseContractModal}
          projectId={selectedProject.project_id}
        />
      )}

      {/* SOP Modal */}
      {showSOPModal && selectedProject && (
        <SOPModal
          onClose={handleCloseSOPModal}
          projectId={selectedProject.project_id}
        />
      )}

    </motion.div>
  )
}