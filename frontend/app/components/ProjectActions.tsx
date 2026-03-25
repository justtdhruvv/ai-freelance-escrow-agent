'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Eye, Edit, Target, Wallet, AlertTriangle, MessageSquare, Trash2, FilePlus, FileText, FileCheck, FileCode } from 'lucide-react'
import { Project } from '../../types/project'

interface ProjectActionsProps {
  project: Project
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

export default function ProjectActions({
  project,
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
}: ProjectActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const dropdownItems = [
    {
      icon: Eye,
      label: 'View Project',
      action: () => onViewProject(project),
      color: 'text-gray-700'
    },
    {
      icon: Edit,
      label: 'Edit Project',
      action: () => onEditProject(project),
      color: 'text-gray-700'
    },
    {
      icon: FilePlus,
      label: 'Add Project Brief',
      action: () => onAddProjectBrief(project),
      color: 'text-blue-600'
    },
    {
      icon: FileText,
      label: 'View Project Briefs',
      action: () => onViewProjectBrief(project),
      color: 'text-purple-600'
    },
    {
      icon: FileCheck,
      label: 'View Contract',
      action: () => onViewContract(project),
      color: 'text-green-600'
    },
    {
      icon: FileCode,
      label: 'Create SOP',
      action: () => onCreateSOP(project),
      color: 'text-orange-600'
    },
    {
      icon: Target,
      label: 'View Milestones',
      action: () => onViewMilestones(project),
      color: 'text-gray-700'
    },
    {
      icon: Wallet,
      label: 'Fund Escrow',
      action: () => onFundEscrow(project),
      color: 'text-green-600',
      disabled: project.status === 'completed'
    },
    {
      icon: Wallet,
      label: 'Release Payment',
      action: () => onReleasePayment(project),
      color: 'text-blue-600',
      disabled: project.status !== 'review'
    },
    {
      icon: AlertTriangle,
      label: 'Open Dispute',
      action: () => onOpenDispute(project),
      color: 'text-orange-600',
      disabled: project.status === 'disputed' || project.status === 'completed'
    },
    {
      icon: MessageSquare,
      label: 'Message Freelancer',
      action: () => onMessageFreelancer(project),
      color: 'text-purple-600'
    },
    {
      icon: Trash2,
      label: 'Delete Project',
      action: () => onDeleteProject(project),
      color: 'text-red-600',
      disabled: project.status === 'active'
    }
  ]

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              className="absolute right-0 top-8 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="py-1">
                {dropdownItems.map((item, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAction(item.action)}
                    disabled={item.disabled}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                      item.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : `${item.color} hover:bg-gray-50`
                    }`}
                    whileHover={!item.disabled ? { x: 4 } : {}}
                    whileTap={!item.disabled ? { scale: 0.98 } : {}}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
