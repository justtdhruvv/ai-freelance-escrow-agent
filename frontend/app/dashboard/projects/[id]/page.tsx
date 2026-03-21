'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Shield, 
  Users, 
  CheckCircle, 
  Clock, 
  Lock,
  AlertCircle
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../../store'
import { useGetProjectQuery } from '../../../store/api/projectsApi'
import { useCreateContractMutation, useApproveClientMutation, useApproveFreelancerMutation, useLockContractMutation } from '../../../store/api/contractApi'
import { useAddProjectBriefMutation } from '../../../store/api/projectsApi'
import { setCurrentProject } from '../../../store/slices/projectSlice'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const projectId = params.id as string
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [briefData, setBriefData] = useState({
    raw_text: '',
    domain: ''
  })

  // API hooks
  const { data: project, isLoading, error } = useGetProjectQuery(projectId)
  const [addProjectBrief, { isLoading: isAddingBrief }] = useAddProjectBriefMutation()
  const [createContract, { isLoading: isCreatingContract }] = useCreateContractMutation()
  const [approveClient, { isLoading: isApprovingClient }] = useApproveClientMutation()
  const [approveFreelancer, { isLoading: isApprovingFreelancer }] = useApproveFreelancerMutation()
  const [lockContract, { isLoading: isLockingContract }] = useLockContractMutation()

  const handleAddBrief = async () => {
    try {
      await addProjectBrief({
        projectId,
        data: briefData
      }).unwrap()
      setShowBriefModal(false)
      setBriefData({ raw_text: '', domain: '' })
    } catch (error) {
      console.error('Failed to add brief:', error)
    }
  }

  const handleCreateContract = async () => {
    try {
      await createContract({ projectId }).unwrap()
    } catch (error) {
      console.error('Failed to create contract:', error)
    }
  }

  const handleApproveClient = async (contractId: string) => {
    try {
      await approveClient(contractId).unwrap()
    } catch (error) {
      console.error('Failed to approve client:', error)
    }
  }

  const handleApproveFreelancer = async (contractId: string) => {
    try {
      await approveFreelancer(contractId).unwrap()
    } catch (error) {
      console.error('Failed to approve freelancer:', error)
    }
  }

  const handleLockContract = async (contractId: string) => {
    try {
      await lockContract(contractId).unwrap()
    } catch (error) {
      console.error('Failed to lock contract:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Loading project details...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load project details</p>
          <button 
            onClick={() => router.push('/dashboard/projects')}
            className="px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344]"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project #{project.id}</h1>
              <p className="text-gray-600 mt-1">Manage project details and contracts</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="text-xl font-bold text-gray-900">${project.total_price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Timeline</p>
              <p className="text-xl font-bold text-gray-900">{project.timeline_days} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Client ID</p>
              <p className="text-xl font-bold text-gray-900">{project.client_id || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {project.status || 'Pending'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Project Brief */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Project Brief</h3>
            </div>
            <button
              onClick={() => setShowBriefModal(true)}
              disabled={!!project.brief}
              className="flex items-center space-x-2 px-3 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{project.brief ? 'Update' : 'Add'} Brief</span>
            </button>
          </div>
          {project.brief ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Domain</p>
                <p className="text-gray-900">{project.brief.domain}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-900 whitespace-pre-wrap">{project.brief.raw_text}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Added</p>
                <p className="text-gray-900">{new Date(project.brief.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No project brief added yet</p>
            </div>
          )}
        </motion.div>

        {/* Contract Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Contract</h3>
            </div>
            <button
              onClick={handleCreateContract}
              className="flex items-center space-x-2 px-3 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Contract</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Client Approval</span>
              </div>
              {project.contract?.client_approved ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Approved</span>
                </div>
              ) : (
                <button
                  onClick={() => project.contract && handleApproveClient(project.contract.id)}
                  disabled={isApprovingClient}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isApprovingClient ? 'Approving...' : 'Approve'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="font-medium">Freelancer Approval</span>
              </div>
              {project.contract?.freelancer_approved ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Approved</span>
                </div>
              ) : (
                <button
                  onClick={() => project.contract && handleApproveFreelancer(project.contract.id)}
                  disabled={isApprovingFreelancer}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isApprovingFreelancer ? 'Approving...' : 'Approve'}</span>
                </button>
              )}
            </div>

            {project.contract && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Contract Status</span>
                </div>
                {project.contract.locked ? (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Locked</span>
                  </div>
                ) : project.contract.client_approved && project.contract.freelancer_approved ? (
                  <button
                    onClick={() => handleLockContract(project.contract.id)}
                    disabled={isLockingContract}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isLockingContract ? 'Locking...' : 'Lock Contract'}</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Pending Approvals</span>
                  </div>
                )}
              </div>
            )}

            {!project.contract && (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-600">No contract created yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Brief Modal */}
      {showBriefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {project.brief ? 'Update' : 'Add'} Project Brief
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={briefData.domain}
                  onChange={(e) => setBriefData({ ...briefData, domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56]"
                  placeholder="e.g., web development, mobile app"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                <textarea
                  value={briefData.raw_text}
                  onChange={(e) => setBriefData({ ...briefData, raw_text: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56]"
                  placeholder="Describe the project requirements, scope, and deliverables..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBriefModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBrief}
                disabled={isAddingBrief}
                className="px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] disabled:opacity-50"
              >
                {isAddingBrief ? 'Saving...' : 'Save Brief'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
