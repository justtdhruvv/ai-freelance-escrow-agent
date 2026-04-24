'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Check, Clock, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  useGenerateSOPMutation,
  useGetSOPQuery,
  useGetSOPMilestonesQuery,
  useGetProjectSOPsQuery,
  useGetProjectQuery,
  useApproveSOPMutation,
} from '../store/api/projectsApi'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { TokenManager } from '../utils/authToken'
import { API_URL } from '../utils/apiUrl'

interface SOPModalProps {
  onClose: () => void
  projectId: string
}

export default function SOPModal({ onClose, projectId }: SOPModalProps) {
  const { user } = useSelector((state: RootState) => state.auth)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSOPId, setGeneratedSOPId] = useState<string | null>(null)
  const [briefs, setBriefs] = useState<any[]>([])

  // Load existing SOPs for the project
  const { data: existingSOPs, refetch: refetchSOPs } = useGetProjectSOPsQuery(projectId, { skip: !projectId })
  const latestSOP = existingSOPs?.[0] || null

  // Use generatedSOPId if just created, otherwise use latest existing
  const activeSopId = generatedSOPId || latestSOP?.sop_id || null

  const { data: project } = useGetProjectQuery(projectId, { skip: !projectId })
  const [generateSOP] = useGenerateSOPMutation()
  const [approveSOP, { isLoading: isApproving }] = useApproveSOPMutation()

  const { data: sop, isLoading: sopLoading } = useGetSOPQuery(activeSopId || '', { skip: !activeSopId })
  const { data: milestones, isLoading: milestonesLoading } = useGetSOPMilestonesQuery(activeSopId || '', { skip: !activeSopId })

  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        const authHeaders = TokenManager.getAuthHeader()
        const res = await fetch(`${API_URL}/projects/${projectId}/brief`, {
          headers: { 'Content-Type': 'application/json', ...authHeaders }
        })
        const data = await res.json()
        let briefsData: any[] = []
        if (Array.isArray(data)) briefsData = data
        else if (data?.briefs) briefsData = data.briefs
        else if (data?.brief) briefsData = Array.isArray(data.brief) ? data.brief : [data.brief]
        else if (data?.brief_id) briefsData = [data]
        setBriefs(briefsData)
      } catch (err) {
        console.error('Error fetching briefs:', err)
      }
    }
    if (projectId) fetchBriefs()
  }, [projectId])

  const handleGenerateSOP = async () => {
    if (!briefs.length) {
      setErrorMessage('No project brief found. Please add a project brief first.')
      return
    }
    try {
      setIsGenerating(true)
      setSuccessMessage('')
      setErrorMessage('')
      const result = await generateSOP({
        project_id: projectId,
        raw_text: briefs[0].raw_text,
        domain: briefs[0].domain,
        timeline_days: project?.timeline_days || 14
      }).unwrap()
      setGeneratedSOPId(result.sop_id)
      setSuccessMessage('SOP generated successfully!')
      refetchSOPs()
    } catch (err) {
      setErrorMessage('Failed to generate SOP. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApproveSOP = async () => {
    if (!activeSopId) return
    try {
      await approveSOP(activeSopId).unwrap()
      setSuccessMessage('SOP approved successfully!')
      refetchSOPs()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setErrorMessage('Failed to approve SOP.')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const isFreelancer = user?.role === 'freelancer'
  const isEmployer = user?.role === 'employer'
  const alreadyApproved = sop
    ? (isFreelancer && sop.freelancer_approved === 1) || (isEmployer && sop.client_approved === 1)
    : false
  const bothApproved = sop && sop.freelancer_approved === 1 && sop.client_approved === 1

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl mx-4 bg-white rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeSopId ? 'Standard Operating Procedure' : 'Generate SOP'}
                </h2>
                {sop && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">v{sop.version}</span>
                    {bothApproved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <Lock className="w-3 h-3" /> Locked & Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3" /> Pending Approval
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                {errorMessage}
              </div>
            )}

            {/* No SOP yet — show generate form */}
            {!activeSopId && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Generate Standard Operating Procedure</h3>

                <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Project Brief</p>
                    {briefs.length === 0 ? (
                      <p className="text-sm text-gray-500">No brief added yet. Please add a brief first.</p>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs font-medium text-blue-600 mb-1">{briefs[0]?.domain?.toUpperCase()}</p>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{briefs[0]?.raw_text}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border p-3">
                      <p className="text-xs text-gray-500">Domain</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{briefs[0]?.domain || 'Not specified'}</p>
                    </div>
                    <div className="bg-white rounded-lg border p-3">
                      <p className="text-xs text-gray-500">Timeline</p>
                      <p className="text-sm font-semibold text-gray-800">{project?.timeline_days ?? 14} days</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerateSOP}
                  disabled={isGenerating || briefs.length === 0}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating SOP...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate SOP
                    </>
                  )}
                </button>
              </div>
            )}

            {/* SOP loaded */}
            {activeSopId && (sopLoading || milestonesLoading) && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}

            {activeSopId && sop && (
              <div className="space-y-6">
                {/* Approval Status */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Approval Status</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${sop.freelancer_approved === 1 ? 'bg-green-500' : 'bg-gray-200'}`}>
                        {sop.freelancer_approved === 1 && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">Freelancer {sop.freelancer_approved === 1 ? 'Approved' : 'Pending'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${sop.client_approved === 1 ? 'bg-green-500' : 'bg-gray-200'}`}>
                        {sop.client_approved === 1 && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">Client {sop.client_approved === 1 ? 'Approved' : 'Pending'}</span>
                    </div>
                  </div>
                  {bothApproved && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      Both parties approved — SOP is locked and the project is now active.
                    </p>
                  )}
                </div>

                {/* SOP Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">SOP Content</h3>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: sop.content_html }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                {milestones && milestones.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Milestones ({milestones.length})</h3>
                    <div className="space-y-3">
                      {milestones.map((milestone) => (
                        <div key={milestone.milestone_id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              milestone.status === 'completed' ? 'bg-green-100 text-green-800'
                                : milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-700'
                            }`}>
                              {milestone.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm text-gray-600">
                            <div>
                              <p className="text-gray-400 text-xs">Deadline</p>
                              <p className="font-medium">{new Date(milestone.deadline).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Payment</p>
                              <p className="font-medium">₹{milestone.payment_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Revisions</p>
                              <p className="font-medium">{milestone.revisions_used}/{milestone.max_revisions}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer — approve button */}
          {activeSopId && sop && (
            <div className="flex gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {!alreadyApproved && !bothApproved && (
                <button
                  onClick={handleApproveSOP}
                  disabled={isApproving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isApproving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Approve SOP as {isFreelancer ? 'Freelancer' : 'Client'}
                    </>
                  )}
                </button>
              )}
              {alreadyApproved && !bothApproved && (
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  You approved — waiting for other party
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
