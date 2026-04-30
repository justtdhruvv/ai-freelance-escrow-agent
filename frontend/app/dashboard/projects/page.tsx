'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Filter, Briefcase, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { useGetProjectsQuery } from '../../store/api/projectsApi'
import { useVerifyStripeSessionMutation } from '../../store/api/paymentApi'
import ProjectTable from '../../components/ProjectTable'
import CreateProjectModal from '../../components/CreateProjectModal'
import ViewProjectModal from '../../components/ViewProjectModal'
import MilestonesModal from '../../components/MilestonesModal'
import FundEscrowModal from '../../components/FundEscrowModal'
import DisputeModal from '../../components/DisputeModal'
import MessageModal from '../../components/MessageModal'
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal'
import { Project } from '../../../types/project'

function StatusBadge({ status }: { status?: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active:    { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Active' },
    pending:   { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    completed: { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Completed' },
    disputed:  { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Disputed' },
    review:    { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Review' },
  }
  const c = config[status || ''] || config.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function EmployerProjectsTable({
  searchTerm,
  filterStatus,
  onFundEscrow,
  onRaiseDispute,
}: {
  searchTerm: string
  filterStatus: string
  onFundEscrow: (project: Project) => void
  onRaiseDispute: (project: Project) => void
}) {
  const router = useRouter()
  const { data, isLoading, isError } = useGetProjectsQuery()

  const extractProjects = (raw: any): Project[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && 'projects' in raw) return raw.projects || []
    return []
  }

  const projects = extractProjects(data)

  const filtered = useMemo(() => {
    return projects.filter((p: Project) => {
      const matchesSearch =
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.project_id || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === 'all' || p.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [projects, searchTerm, filterStatus])

  if (isLoading) return <div className="p-6 text-gray-500">Loading projects...</div>
  if (isError)   return <div className="p-6 text-red-500">Failed to load projects</div>

  if (filtered.length === 0) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[70vh]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Your freelancer will create the project and assign you to it
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 w-[25%]">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 w-[20%]">Freelancer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 w-[12%]">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 w-[12%]">Timeline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 w-[12%]">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 w-[19%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((project: Project, index: number) => (
              <motion.tr
                key={project.project_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {project.name || `Project ${project.project_id.slice(0, 8)}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(project.created_at || '').toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {project.freelancer_id ? (
                    <span className="font-mono text-xs">{project.freelancer_id.slice(0, 12)}…</span>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  ${project.total_price.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {project.timeline_days} days
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => router.push(`/dashboard/projects/${project.project_id}`)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                    {project.status === 'pending' && (
                      <button
                        onClick={() => onFundEscrow(project)}
                        className="px-3 py-1 text-xs bg-[#AD7D56] hover:bg-[#8B6344] text-white rounded-lg transition-colors"
                      >
                        Fund Escrow
                      </button>
                    )}
                    {project.status === 'active' && (
                      <button
                        onClick={() => onRaiseDispute(project)}
                        className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      >
                        Raise Dispute
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user } = useSelector((state: RootState) => state.auth)
  const isEmployer = user?.role === 'employer'

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
  const [paymentBanner, setPaymentBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [verifyStripeSession] = useVerifyStripeSessionMutation()

  // Handle return from Stripe Checkout — detect session_id + project_id in URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const projectId = params.get('project_id')
    const cancelled = params.get('payment_cancelled')

    if (cancelled) {
      setPaymentBanner({ type: 'error', message: 'Payment cancelled. Your project has not been funded.' })
      router.replace('/dashboard/projects')
      return
    }

    if (sessionId && projectId) {
      // Clear URL params immediately
      router.replace('/dashboard/projects')
      // Verify with backend and fund escrow
      verifyStripeSession({ sessionId, projectId })
        .unwrap()
        .then(() => {
          setPaymentBanner({ type: 'success', message: 'Payment successful! Funds are now held in escrow.' })
        })
        .catch((err: any) => {
          const msg = err?.data?.error || 'Payment verification failed. Contact support.'
          setPaymentBanner({ type: 'error', message: msg })
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white min-h-screen bg-gray-5 p-6">
      {/* Stripe payment result banner */}
      <AnimatePresence>
        {paymentBanner && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
              paymentBanner.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {paymentBanner.type === 'success'
              ? <CheckCircle className="w-5 h-5 shrink-0" />
              : <XCircle className="w-5 h-5 shrink-0" />}
            <span className="flex-1">{paymentBanner.message}</span>
            <button onClick={() => setPaymentBanner(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">Projects</h1>
            <p className="text-gray-600 mt-1">
              {isEmployer
                ? 'Your active and pending escrow projects'
                : 'Manage all your freelance escrow projects'}
            </p>
          </div>

          {!isEmployer && (
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              Create New Project
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        className="mb-6"
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

      {/* Role-branched table */}
      {isEmployer ? (
        <EmployerProjectsTable
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onFundEscrow={(project) => {
            setSelectedProject(project)
            setShowFundEscrowModal(true)
          }}
          onRaiseDispute={(project) => {
            setSelectedProject(project)
            setShowDisputeModal(true)
          }}
        />
      ) : (
        <ProjectTable
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onViewProject={(project: Project) => {
            setSelectedProject(project)
            setShowViewModal(true)
          }}
          onEditProject={(project: Project) => {
            setSelectedProject(project)
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
          onCreateProject={() => setShowCreateModal(true)}
        />
      )}

      {/* Freelancer-only modals */}
      {!isEmployer && showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}
      {!isEmployer && showViewModal && selectedProject && (
        <ViewProjectModal
          project={selectedProject}
          onClose={() => setShowViewModal(false)}
        />
      )}
      {!isEmployer && showMilestonesModal && selectedProject && (
        <MilestonesModal
          project={selectedProject}
          onClose={() => setShowMilestonesModal(false)}
        />
      )}
      {!isEmployer && showMessageModal && selectedProject && (
        <MessageModal
          project={selectedProject}
          onClose={() => setShowMessageModal(false)}
        />
      )}
      {!isEmployer && showDeleteModal && selectedProject && (
        <DeleteConfirmationModal
          project={selectedProject}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => setShowDeleteModal(false)}
        />
      )}

      {/* Shared modals */}
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
    </div>
  )
}
