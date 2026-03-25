'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Clock, Check, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  useGenerateSOPMutation,
  useGetSOPQuery,
  useGetSOPMilestonesQuery,
  useAddProjectBriefMutation,
  useGetProjectQuery
} from '../store/api/projectsApi'
import { TokenManager } from '../utils/authToken'

interface SOPModalProps {
  onClose: () => void
  projectId: string
}

export default function SOPModal({
  onClose,
  projectId
}: SOPModalProps) {
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSOPId, setGeneratedSOPId] = useState<string | null>(null)
  const [briefs, setBriefs] = useState<any[]>([])

  console.log("🔥 SOP useEffect triggered", projectId)

  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        const authHeaders = TokenManager.getAuthHeader()

        const res = await fetch(`http://localhost:3000/projects/${projectId}/brief`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          }
        })

        const data = await res.json()
        console.log("SOP Brief API:", data)

        let briefsData = []

        // ✅ HANDLE ALL CASES PROPERLY
        if (Array.isArray(data)) {
          briefsData = data
        } else if (data?.briefs) {
          briefsData = data.briefs
        } else if (data?.brief) {
          briefsData = Array.isArray(data.brief) ? data.brief : [data.brief]
        } else if (data?.brief_id) {
          // 🔥 THIS IS YOUR CASE
          briefsData = [data]
        }

        setBriefs(briefsData)
        console.log("Processed Briefs:", briefsData)

      } catch (err) {
        console.error("Error fetching briefs:", err)
      }
    }

    if (projectId) fetchBriefs()
  }, [projectId])
  // Get project details to access brief data
  const {
    data: project,
    isLoading: projectLoading
  } = useGetProjectQuery(projectId, {
    skip: !projectId
  })

  const [generateSOP] = useGenerateSOPMutation()

  // Get SOP details if we have a generated SOP ID
  const {
    data: sop,
    isLoading: sopLoading,
    error: sopError
  } = useGetSOPQuery(generatedSOPId || '', {
    skip: !generatedSOPId
  })

  // Get milestones if we have a SOP
  const {
    data: milestones,
    isLoading: milestonesLoading
  } = useGetSOPMilestonesQuery(generatedSOPId || '', {
    skip: !generatedSOPId
  })

  const handleGenerateSOP = async () => {
    // Use actual project brief data from the project
    if (!briefs.length) {
      setErrorMessage('No project brief found. Please add a project brief first.')
      return
    }

    const briefData = {
      raw_text: briefs[0].raw_text, // 👈 take first brief
      domain: briefs[0].domain,
      timeline_days: 14
    }

    try {
      setIsGenerating(true)
      setSuccessMessage('')
      setErrorMessage('')

      const result = await generateSOP({
        project_id: projectId,
        raw_text: briefData.raw_text,
        domain: briefData.domain,
        timeline_days: briefData.timeline_days
      }).unwrap()

      setGeneratedSOPId(result.sop_id)
      setSuccessMessage('SOP generated successfully!')

      // Auto-refresh after successful generation
      setTimeout(() => {
        setSuccessMessage('')
        window.location.reload()
      }, 2000)

    } catch (err) {
      setErrorMessage('Failed to generate SOP. Please try again.')
      console.error('Generate SOP error:', err)
    } finally {
      setIsGenerating(false)
    }
  }
  console.log("Briefs State:", briefs) // ✅ ADD HERE
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
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {generatedSOPId ? 'Standard Operating Procedure' : 'Generate SOP'}
                </h2>
                {generatedSOPId && (
                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Version {sop?.version || 1}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm mb-4">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {errorMessage}
              </div>
            )}

            {/* SOP Generation Form */}
            {!generatedSOPId && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Standard Operating Procedure</h3>

                <div className="bg-gray-50 rounded-xl p-5 space-y-5 border border-gray-200">

                  {/* Header */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Project Brief</p>

                    {!briefs || briefs.length === 0 ? (
                      <p className="text-sm text-gray-500">No brief added yet</p>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <p className="text-xs font-medium text-blue-600 mb-1 tracking-wide">
                          {briefs[0]?.domain?.toUpperCase()}
                        </p>

                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {briefs[0]?.raw_text}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-4">

                    {/* Domain */}
                    <div className="bg-white rounded-lg border p-3">
                      <p className="text-xs text-gray-500">Domain</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {briefs[0]?.domain || 'Not specified'}
                      </p>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-lg border p-3">
                      <p className="text-xs text-gray-500">Timeline</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {project?.timeline_days ?? 14} days
                      </p>
                    </div>

                  </div>
                </div>

                <button
                  onClick={handleGenerateSOP}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating SOP...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate SOP</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* SOP Content */}
            {generatedSOPId && sop && (
              <div className="space-y-6">
                {/* SOP Details */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="text-gray-500">SOP ID</p>
                    <p className="font-medium text-gray-900">{sop.sop_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Version</p>
                    <p className="font-medium text-gray-900">{sop.version}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(sop.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${sop.client_approved === 1 && sop.freelancer_approved === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {sop.client_approved === 1 && sop.freelancer_approved === 1 ? 'Both Approved' : 'Pending Approval'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SOP Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SOP Content</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: sop.content_html }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                {milestones && milestones.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h3>
                    <div className="space-y-3">
                      {milestones.map((milestone, index) => (
                        <div key={milestone.milestone_id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${milestone.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : milestone.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {milestone.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p className="text-gray-500">Deadline</p>
                              <p className="font-medium text-gray-900">
                                {new Date(milestone.deadline).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Payment Amount</p>
                              <p className="font-medium text-gray-900">₹{milestone.payment_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Revisions</p>
                              <p className="font-medium text-gray-900">
                                {milestone.revisions_used}/{milestone.max_revisions}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading States */}
            {(sopLoading || milestonesLoading) && generatedSOPId && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {sopError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                Failed to load SOP. Please try again.
              </div>
            )}
          </div>

          {/* Footer */}
          {generatedSOPId && (
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
