'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Send, CheckCircle } from 'lucide-react'
import { useCreateDisputeMutation } from '../store/api/projectsApi'

interface DisputeModalProps {
  project: {
    project_id: string
    name?: string
    status?: string
    total_price?: number
    escrow_balance?: number
  }
  milestoneId?: string
  onClose: () => void
}

const DISPUTE_TYPES = [
  { id: 'quality', title: 'Quality Issues', description: 'Work does not meet quality standards or AQA requirements' },
  { id: 'aqa_conflict', title: 'AQA Result Conflict', description: 'AQA verdict does not match actual delivery quality' },
  { id: 'deadline', title: 'Deadline Missed', description: 'Milestone deadline has passed without submission' },
  { id: 'scope', title: 'Scope Disagreement', description: 'Disagreement about what was agreed in the SOP' },
  { id: 'payment', title: 'Payment Issues', description: 'Disputes related to escrow release or payment amount' },
  { id: 'communication', title: 'Communication Problems', description: 'Lack of response or poor communication' },
  { id: 'other', title: 'Other Issues', description: 'Any other type of dispute or concern' },
]

export default function DisputeModal({ project, milestoneId, onClose }: DisputeModalProps) {
  const [disputeType, setDisputeType] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [createDispute, { isLoading }] = useCreateDisputeMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeType || !description.trim()) return

    try {
      await createDispute({
        project_id: project.project_id,
        dispute_type: disputeType,
        description: description.trim(),
        milestone_id: milestoneId,
      }).unwrap()
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to create dispute', err)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Open Dispute</h2>
                <p className="text-sm text-gray-500">{project.name || project.project_id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {submitted ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dispute Submitted</h3>
              <p className="text-gray-600 mb-2">
                Your dispute has been recorded. The project is now paused and the escrow is frozen.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Both parties will be notified. A resolution will be reached through the mediation process.
              </p>
              <button onClick={onClose} className="px-6 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-orange-900">Opening a dispute will freeze escrow</p>
                    <p className="text-sm text-orange-700 mt-1">
                      The project status will change to "Disputed" and no payments will be released until resolved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dispute Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Dispute Type *</label>
                <div className="space-y-2">
                  {DISPUTE_TYPES.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setDisputeType(type.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        disputeType === type.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                          disputeType === type.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{type.title}</p>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                  placeholder="Describe the issue in detail. Include specific examples and any relevant context..."
                />
                <p className="text-xs text-gray-400 mt-1">{description.length}/1000 characters</p>
              </div>

              {/* Project Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Project Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Project</p>
                    <p className="font-medium text-gray-900">{project.name || project.project_id.substring(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium text-gray-900 capitalize">{project.status || 'active'}</p>
                  </div>
                  {project.escrow_balance !== undefined && (
                    <div>
                      <p className="text-gray-500">Escrow Balance</p>
                      <p className="font-medium text-gray-900">₹{project.escrow_balance.toLocaleString()}</p>
                    </div>
                  )}
                  {milestoneId && (
                    <div>
                      <p className="text-gray-500">Milestone ID</p>
                      <p className="font-medium text-gray-900 font-mono text-xs">{milestoneId.substring(0, 8)}...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !disputeType || !description.trim()}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Dispute
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
