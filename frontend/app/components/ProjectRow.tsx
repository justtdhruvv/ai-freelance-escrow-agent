'use client'

import { motion } from 'framer-motion'
import ProjectActions from './ProjectActions'

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

interface ProjectRowProps {
  project: Project
  index: number
  onViewProject: (project: Project) => void
  onEditProject: (project: Project) => void
  onViewMilestones: (project: Project) => void
  onFundEscrow: (project: Project) => void
  onReleasePayment: (project: Project) => void
  onOpenDispute: (project: Project) => void
  onMessageFreelancer: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

const statusColors = {
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  review: 'bg-yellow-100 text-yellow-800',
  disputed: 'bg-red-100 text-red-800'
}

const getRiskColor = (riskScore: number) => {
  if (riskScore <= 20) return 'text-green-600'
  if (riskScore <= 40) return 'text-yellow-600'
  if (riskScore <= 60) return 'text-orange-600'
  return 'text-red-600'
}

export default function ProjectRow({
  project,
  index,
  onViewProject,
  onEditProject,
  onViewMilestones,
  onFundEscrow,
  onReleasePayment,
  onOpenDispute,
  onMessageFreelancer,
  onDeleteProject
}: ProjectRowProps) {
  return (
    <motion.tr 
      className="hover:bg-gray-50 transition-colors"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
      whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
    >
      {/* Project Name */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#111111]">{project.name}</p>
            {project.riskScore && (
              <span className={`text-xs font-medium ${getRiskColor(project.riskScore)}`}>
                {project.riskScore}%
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <motion.div 
              className="bg-[#AD7D56] h-1.5 rounded-full" 
              style={{ width: `${project.progress}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
            />
          </div>
        </div>
      </td>

      {/* Client */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {project.client}
      </td>

      {/* Freelancer */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {project.freelancer}
      </td>

      {/* Total Escrow Amount */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111111]">
        ${project.totalEscrowAmount.toLocaleString()}
      </td>

      {/* Milestones */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {project.milestones}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <motion.span 
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
        >
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </motion.span>
      </td>

      {/* Progress */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-[#AD7D56] h-2 rounded-full" 
              style={{ width: `${project.progress}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
            />
          </div>
          <span className="text-sm text-gray-600">{project.progress}%</span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <ProjectActions
          project={project}
          onViewProject={onViewProject}
          onEditProject={onEditProject}
          onViewMilestones={onViewMilestones}
          onFundEscrow={onFundEscrow}
          onReleasePayment={onReleasePayment}
          onOpenDispute={onOpenDispute}
          onMessageFreelancer={onMessageFreelancer}
          onDeleteProject={onDeleteProject}
        />
      </td>
    </motion.tr>
  )
}
