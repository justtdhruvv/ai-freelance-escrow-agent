'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, DollarSign, Target, User, FileText, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { useGetClientsQuery } from '../store/api/clientsApi'

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

interface ViewProjectModalProps {
  project: Project
  onClose: () => void
}

const statusColors = {
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  review: 'bg-yellow-100 text-yellow-800',
  disputed: 'bg-red-100 text-red-800'
}

const mockMilestones = [
  { id: '1', name: 'Project Setup', amount: 2000, status: 'completed', dueDate: '2024-01-20' },
  { id: '2', name: 'Core Development', amount: 5000, status: 'completed', dueDate: '2024-02-15' },
  { id: '3', name: 'Testing & QA', amount: 3500, status: 'in-progress', dueDate: '2024-03-01' },
  { id: '4', name: 'Final Delivery', amount: 2000, status: 'pending', dueDate: '2024-03-15' }
]

const mockTimeline = [
  { date: '2024-01-15', event: 'Project Started', type: 'start' },
  { date: '2024-01-20', event: 'Milestone 1 Completed', type: 'milestone' },
  { date: '2024-02-15', event: 'Milestone 2 Completed', type: 'milestone' },
  { date: '2024-02-20', event: 'Testing Phase Started', type: 'progress' }
]



export default function ViewProjectModal({ project, onClose }: ViewProjectModalProps) {

    const { data: clientsData } = useGetClientsQuery()
  const clients = clientsData?.clients || []

    const clientMap = useMemo(() => {
    const map: Record<string, string> = {}

    clients.forEach((c: any) => {
      map[c.user_id] = c.email
    })

    return map
  }, [clients])
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-semibold text-[#111111]">{project.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                {project.riskScore && (
                  <span className="text-sm text-gray-600">Risk Score: {project.riskScore}%</span>
                )}
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
            {/* Project Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-medium text-[#111111]">{clientMap[project.employer_id]
                      ? clientMap[project.employer_id]
                      : clients.length === 0
                        ? 'Loading...'
                        : 'Unknown Client'}</p>
                  </div>
                </div>

                {/* <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Freelancer</p>
                    <p className="font-medium text-[#111111]">{project.freelancer}</p>
                  </div>
                </div> */}

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Total Escrow Amount</p>
                    <p className="font-medium text-[#111111]">
                      ${Number(project.totalEscrowAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium text-[#111111]">{new Date(project.created_at || '').toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Deadline</p>
                    <p className="font-medium text-[#111111]">{project.timeline_days} days</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Total Milestones</p>
                    <p className="font-medium text-[#111111]">{project.milestones}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-[#111111]">Project Description</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {project.description || 'No description provided.'}
              </p>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-[#111111]">Project Progress</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-medium text-[#111111]">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#AD7D56] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-[#111111]">Milestones</h3>
              </div>
              <div className="space-y-3">
                {mockMilestones.map((milestone, index) => (
                  <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#111111]">{milestone.name}</p>
                        <p className="text-sm text-gray-600">Due: {milestone.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[#111111]">${milestone.amount.toLocaleString()}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                          milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {milestone.status.replace('-', ' ').charAt(0).toUpperCase() + milestone.status.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-[#111111]">Activity Timeline</h3>
              </div>
              <div className="space-y-3">
                {mockTimeline.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${item.type === 'start' ? 'bg-green-500' :
                        item.type === 'milestone' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`} />
                      {index < mockTimeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#111111]">{item.event}</p>
                      <p className="text-sm text-gray-600">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
