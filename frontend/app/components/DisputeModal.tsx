'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Upload, FileText, Send } from 'lucide-react'

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

interface DisputeModalProps {
  project: Project
  onClose: () => void
}

export default function DisputeModal({ project, onClose }: DisputeModalProps) {
  const [disputeType, setDisputeType] = useState('')
  const [description, setDescription] = useState('')
  const [evidence, setEvidence] = useState<FileList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const disputeTypes = [
    {
      id: 'quality',
      title: 'Quality Issues',
      description: 'Work does not meet quality standards or requirements'
    },
    {
      id: 'deadline',
      title: 'Deadline Missed',
      description: 'Project or milestone deadlines have been missed'
    },
    {
      id: 'communication',
      title: 'Communication Problems',
      description: 'Lack of response or poor communication'
    },
    {
      id: 'scope',
      title: 'Scope Disagreement',
      description: 'Disagreement about project scope or deliverables'
    },
    {
      id: 'payment',
      title: 'Payment Issues',
      description: 'Disputes related to payment or escrow release'
    },
    {
      id: 'other',
      title: 'Other Issues',
      description: 'Any other type of dispute or concern'
    }
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvidence(e.target.files)
  }

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('Submitting dispute:', {
      projectId: project.id,
      disputeType,
      description,
      evidence: evidence ? Array.from(evidence).map(f => f.name) : []
    })

    setIsSubmitting(false)
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
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
                <h2 className="text-2xl font-semibold text-[#111111]">Open Dispute</h2>
                <p className="text-gray-600 mt-1">{project.name}</p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmitDispute} className="p-6 space-y-6">
            {/* Warning Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Dispute Resolution Process</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Opening a dispute will temporarily pause the project and freeze escrow funds. 
                    Our mediation team will review both sides and work towards a fair resolution. 
                    This process typically takes 3-5 business days.
                  </p>
                </div>
              </div>
            </div>

            {/* Dispute Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dispute Type *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {disputeTypes.map((type) => (
                  <motion.div
                    key={type.id}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                      disputeType === type.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setDisputeType(type.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        disputeType === type.id
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {disputeType === type.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#111111]">{type.title}</p>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent resize-none"
                placeholder="Please provide a detailed description of the issue. Include specific examples, dates, and any relevant information that will help our mediation team understand the situation."
              />
              <p className="text-sm text-gray-500 mt-1">
                {description.length}/500 characters
              </p>
            </div>

            {/* Evidence Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Evidence
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload screenshots, contracts, or other evidence
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Choose Files
                </label>
                {evidence && (
                  <p className="text-sm text-green-600 mt-2">
                    {evidence.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* Project Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-[#111111] mb-2">Project Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Project Name:</p>
                  <p className="font-medium">{project.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Escrow Amount:</p>
                  <p className="font-medium">${project.totalEscrowAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Freelancer:</p>
                  <p className="font-medium">{project.freelancer}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Status:</p>
                  <p className="font-medium">{project.status}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                Cancel
              </motion.button>

              <motion.button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting || !disputeType || !description}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Dispute
                  </div>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
