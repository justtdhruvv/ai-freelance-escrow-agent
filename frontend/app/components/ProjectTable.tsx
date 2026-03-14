'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import ProjectRow from './ProjectRow'
import CreateProjectModal from './CreateProjectModal'
import { projectService, Project } from "../services/projectService"

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

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const itemsPerPage = 5

  useEffect(() => {

    const loadProjects = async () => {

      try {

        const data = await projectService.getProjects()

        // ⭐ Backend response mapping
        const mappedProjects = data.map((p: any) => ({
          id: p.id || p.project_id,
          title: p.title || "Untitled Project",
          clientEmail: p.clientEmail || p.client_email || "client@email.com",
          freelancer: p.freelancer || "Assigned Freelancer",
          totalEscrowAmount: p.totalEscrowAmount || p.total_price || p.budget || 0,
          milestones: p.milestones || 0,
          status: p.status || "active",
          progress: p.progress || 0,
          description: p.description,
          deadline: p.deadline,
          budget: p.budget
        }))

        setProjects(mappedProjects)

      } catch (err) {

        console.error("Project fetch error:", err)

      } finally {

        setLoading(false)

      }

    }

    loadProjects()

  }, [])

  const filteredProjects = useMemo(() => {

    return projects.filter(project => {

      const matchesSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.freelancer.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter =
        filterStatus === 'all' || project.status === filterStatus

      return matchesSearch && matchesFilter

    })

  }, [searchTerm, filterStatus, projects])

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

  const handleProjectCreated = () => {
    loadProjects()
  }

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
        // ⭐ Backend response mapping
        const mappedProjects = data.map((p: any) => ({
          id: p.id || p.project_id,
          title: p.title || "Untitled Project",
          clientEmail: p.clientEmail || p.client_email || "client@email.com",
          freelancer: p.freelancer || "Assigned Freelancer",
          totalEscrowAmount: p.totalEscrowAmount || p.total_price || p.budget || 0,
          milestones: p.milestones || 0,
          status: p.status || "active",
          progress: p.progress || 0,
          description: p.description,
          deadline: p.deadline,
          budget: p.budget
        }))

        setProjects(mappedProjects)
    } catch (err) {
        console.error("Project fetch error:", err)
    } finally {
        setLoading(false)
    }
  }

  const paginatedProjects =
    filteredProjects.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading projects...
      </div>
    )
  }

  return (
    <>
      <CreateProjectModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
      />
      
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >

        {/* Header with Create Button */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Create Project
          </motion.button>
        </div>

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

      {filteredProjects.length === 0 && (

        <div className="text-center py-12">

          <p className="text-gray-500">
            No projects found matching your criteria.
          </p>

        </div>

      )}

      {totalPages > 1 && (

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">

          <div className="text-sm text-gray-600">

            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProjects.length)} of {filteredProjects.length} projects

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (

              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${currentPage === page ? 'bg-[#AD7D56] text-white' : 'border'}`}
              >
                {page}
              </button>

            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      )}

    </motion.div>
    </>
  )
}