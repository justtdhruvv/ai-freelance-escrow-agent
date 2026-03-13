'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Trash2 } from 'lucide-react'

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

interface DeleteConfirmationModalProps {
  project: Project
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteConfirmationModal({ project, onClose, onConfirm }: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText === project.name) {
      setIsDeleting(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onConfirm()
      setIsDeleting(false)
    }
  }

  const canDelete = confirmText === project.name && !isDeleting

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
          className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#111111]">Delete Project</h2>
                <p className="text-gray-600">This action cannot be undone</p>
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

          <div className="p-6 space-y-6">
            {/* Warning Content */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Warning: Permanent Deletion</p>
                  <p className="text-sm text-red-700 mt-1">
                    Deleting this project will permanently remove all associated data including:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                    <li>Project details and history</li>
                    <li>All milestones and progress</li>
                    <li>Escrow transactions and records</li>
                    <li>Messages and communications</li>
                    <li>Files and attachments</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Project Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-[#111111] mb-3">Project to Delete</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Name:</span>
                  <span className="font-medium text-[#111111]">{project.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium">{project.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Freelancer:</span>
                  <span className="font-medium">{project.freelancer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Escrow Amount:</span>
                  <span className="font-medium text-red-600">${project.totalEscrowAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{project.status}</span>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type the project name to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={project.name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                This must match exactly: <span className="font-mono bg-gray-100 px-1 rounded">{project.name}</span>
              </p>
            </div>

            {/* Additional Warning */}
            {project.status === 'active' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Active Project Warning</p>
                    <p className="text-sm text-orange-700 mt-1">
                      This project is currently active. Deleting it may affect ongoing work and escrow funds. 
                      Consider completing or archiving the project instead.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <motion.button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isDeleting}
              >
                Cancel
              </motion.button>

              <motion.button
                onClick={handleDelete}
                disabled={!canDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: canDelete ? 1.02 : 1 }}
                whileTap={{ scale: canDelete ? 0.98 : 1 }}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
