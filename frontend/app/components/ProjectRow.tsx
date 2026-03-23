'use client'

import { motion } from 'framer-motion'
import ProjectActions from './ProjectActions'

interface Project {
  project_id: string
  employer_id: string
  freelancer_id: string
  status: 'draft' | 'active' | 'completed' | 'review' | 'disputed'
  total_price: number
  timeline_days: number
  created_at: string
}

interface ProjectRowProps {
  project: Project
  index: number
  clientEmail: string
  onAddProjectBrief: (project: Project) => void
  onViewProjectBrief: (project: Project) => void
  onViewContract: (project: Project) => void
  onCreateSOP: (project: Project) => void
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
  draft: 'bg-gray-100 text-gray-800',
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
  clientEmail,
  onAddProjectBrief,
  onViewProjectBrief,
  onViewContract,
  onCreateSOP,
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
            <p className="text-sm font-medium text-[#111111]">
              Project #{project.project_id.substring(0, 8)}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Created: {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
      </td>

      {/* Client */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-600 truncate" title={clientEmail}>
          {clientEmail}
        </div>
      </td>

      {/* Budget */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        ₹{project.total_price.toLocaleString()}
      </td>

      {/* Timeline */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {project.timeline_days} days
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}>
          {project.status}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex justify-center">
          <ProjectActions
            project={project}
            clientEmail={clientEmail}
            onAddProjectBrief={onAddProjectBrief}
            onViewProjectBrief={onViewProjectBrief}
            onViewContract={onViewContract}
            onCreateSOP={onCreateSOP}
            onViewProject={onViewProject}
            onEditProject={onEditProject}
            onViewMilestones={onViewMilestones}
            onFundEscrow={onFundEscrow}
            onReleasePayment={onReleasePayment}
            onOpenDispute={onOpenDispute}
            onMessageFreelancer={onMessageFreelancer}
            onDeleteProject={onDeleteProject}
          />
        </div>
      </td>
    </motion.tr>
  )
}
