'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Filter } from 'lucide-react'
import ProjectTable from '../components/ProjectTable'
import CreateProjectModal from '../components/CreateProjectModal'
import ViewProjectModal from '../components/ViewProjectModal'
import MilestonesModal from '../components/MilestonesModal'
import FundEscrowModal from '../components/FundEscrowModal'
import DisputeModal from '../components/DisputeModal'
import MessageModal from '../components/MessageModal'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { Project } from '../../types/project'

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showMilestonesModal, setShowMilestonesModal] = useState(false)
  const [showFundEscrowModal, setShowFundEscrowModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">Projects</h1>
            <p className="text-gray-600 mt-1">Manage all your freelance escrow projects</p>
          </div>
          
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Create New Project
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div 
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="review">In Review</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Projects Table */}
      <ProjectTable
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        onViewProject={(project: Project) => {
          setSelectedProject(project)
          setShowViewModal(true)
        }}
        onEditProject={(project: Project) => {
          setSelectedProject(project)
          // Handle edit
        }}
        onViewMilestones={(project: Project) => {
          setSelectedProject(project)
          setShowMilestonesModal(true)
        }}
        onFundEscrow={(project: Project) => {
          setSelectedProject(project)
          setShowFundEscrowModal(true)
        }}
        onReleasePayment={(project: Project) => {
          setSelectedProject(project)
          // Handle release payment
        }}
        onOpenDispute={(project: Project) => {
          setSelectedProject(project)
          setShowDisputeModal(true)
        }}
        onMessageFreelancer={(project: Project) => {
          setSelectedProject(project)
          setShowMessageModal(true)
        }}
        onDeleteProject={(project: Project) => {
          setSelectedProject(project)
          setShowDeleteModal(true)
        }}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            // Refresh projects list after creation
            window.location.reload()
          }}
        />
      )}
      
      {showViewModal && selectedProject && (
        <ViewProjectModal
          project={selectedProject}
          onClose={() => setShowViewModal(false)}
        />
      )}
      
      {showMilestonesModal && selectedProject && (
        <MilestonesModal
          project={selectedProject}
          onClose={() => setShowMilestonesModal(false)}
        />
      )}
      
      {showFundEscrowModal && selectedProject && (
        <FundEscrowModal
          project={selectedProject}
          onClose={() => setShowFundEscrowModal(false)}
        />
      )}
      
      {showDisputeModal && selectedProject && (
        <DisputeModal
          project={selectedProject}
          onClose={() => setShowDisputeModal(false)}
        />
      )}
      
      {showMessageModal && selectedProject && (
        <MessageModal
          project={selectedProject}
          onClose={() => setShowMessageModal(false)}
        />
      )}
      
      {showDeleteModal && selectedProject && (
        <DeleteConfirmationModal
          project={selectedProject}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            // Handle delete
            setShowDeleteModal(false)
          }}
        />
      )}
    </div>
  )
}
