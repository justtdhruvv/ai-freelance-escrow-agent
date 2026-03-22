'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProjectRow from './ProjectRow'
import { useMemo, useState } from 'react'
import { useGetProjectsQuery } from '../store/api/projectsApi'

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
}: any) {

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // ✅ API CALL
  const { data, isLoading, isError } = useGetProjectsQuery()

  // ✅ Handle response safely
  const projects = data?.projects || data || []

  // ✅ Filtering
  const filteredProjects = useMemo(() => {
    return projects.filter((project: any) => {

      const matchesSearch =
        project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter =
        filterStatus === 'all' || project.status === filterStatus

      return matchesSearch && matchesFilter
    })
  }, [projects, searchTerm, filterStatus])

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

  // ✅ Loading state
  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading projects...</div>
  }

  // ❌ Error state
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
              <th className="px-6 py-3 text-left text-xs">Project</th>
              <th className="px-6 py-3 text-left text-xs">Client</th>
              <th className="px-6 py-3 text-left text-xs">Budget</th>
              <th className="px-6 py-3 text-left text-xs">Timeline</th>
              <th className="px-6 py-3 text-left text-xs">Status</th>
              <th className="px-6 py-3 text-left text-xs">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProjects.map((project: any, index: number) => (
              <ProjectRow
                key={project.id || project.project_id}
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

      {/* Empty */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No projects found
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex justify-between">

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft />
          </button>

          <span>{currentPage} / {totalPages}</span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight />
          </button>

        </div>
      )}

    </motion.div>
  )
}