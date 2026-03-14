'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, DollarSign, Calendar, Check, AlertCircle } from 'lucide-react'

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

interface MilestonesModalProps {
  project: Project
  onClose: () => void
}

const mockMilestones = [
  {
    id: '1',
    name: 'Project Setup & Planning',
    amount: 2500,
    status: 'completed',
    dueDate: '2024-01-20',
    completedDate: '2024-01-18',
    description: 'Initial project setup, requirements gathering, and planning phase'
  },
  {
    id: '2',
    name: 'Core Development Phase 1',
    amount: 4000,
    status: 'completed',
    dueDate: '2024-02-10',
    completedDate: '2024-02-08',
    description: 'Development of core features and functionality'
  },
  {
    id: '3',
    name: 'Core Development Phase 2',
    amount: 3500,
    status: 'in-progress',
    dueDate: '2024-02-28',
    completedDate: null,
    description: 'Advanced features and integration development'
  },
  {
    id: '4',
    name: 'Testing & Quality Assurance',
    amount: 2000,
    status: 'pending',
    dueDate: '2024-03-10',
    completedDate: null,
    description: 'Comprehensive testing and bug fixes'
  },
  {
    id: '5',
    name: 'Final Delivery & Deployment',
    amount: 500,
    status: 'pending',
    dueDate: '2024-03-15',
    completedDate: null,
    description: 'Final delivery, deployment, and documentation'
  }
]

export default function MilestonesModal({ project, onClose }: MilestonesModalProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleApprove = (milestoneId: string) => {
    console.log('Approving milestone:', milestoneId)
    // Handle approval logic
  }

  const handleRequestRevision = (milestoneId: string) => {
    console.log('Requesting revision for milestone:', milestoneId)
    // Handle revision request logic
  }

  const handleReleasePayment = (milestoneId: string) => {
    console.log('Releasing payment for milestone:', milestoneId)
    // Handle payment release logic
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
          className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-semibold text-[#111111]">Project Milestones</h2>
              <p className="text-gray-600 mt-1">{project.name}</p>
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

          <div className="p-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#111111]">{mockMilestones.length}</p>
                  <p className="text-sm text-gray-600">Total Milestones</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {mockMilestones.filter(m => m.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#AD7D56]">
                    ${mockMilestones.reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Value</p>
                </div>
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-4">
              {mockMilestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 text-[#AD7D56]" />
                        <h3 className="font-semibold text-[#111111]">{milestone.name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                          {milestone.status.replace('-', ' ').charAt(0).toUpperCase() + milestone.status.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${milestone.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {milestone.dueDate}</span>
                        </div>
                        {milestone.completedDate && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" />
                            <span>Completed: {milestone.completedDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {milestone.status === 'completed' && (
                        <motion.button
                          onClick={() => handleReleasePayment(milestone.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Release Payment
                        </motion.button>
                      )}
                      
                      {milestone.status === 'in-progress' && (
                        <>
                          <motion.button
                            onClick={() => handleApprove(milestone.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Approve
                          </motion.button>
                          <motion.button
                            onClick={() => handleRequestRevision(milestone.id)}
                            className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Request Revision
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          milestone.status === 'completed' ? 'bg-green-500' :
                          milestone.status === 'in-progress' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`}
                        style={{ 
                          width: milestone.status === 'completed' ? '100%' :
                                 milestone.status === 'in-progress' ? '60%' :
                                 '0%'
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Note */}
            {mockMilestones.some(m => m.status === 'completed') && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Payment Release Required</p>
                    <p className="text-sm text-blue-700 mt-1">
                      You have completed milestones awaiting payment release. Please review and approve to release funds to the freelancer.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
