'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, XCircle, Clock, Bot, RefreshCw } from 'lucide-react'
import {
  useGetProjectsQuery,
  useGetProjectMilestonesQuery,
  Project,
} from '../../store/api/projectsApi'
import { useRouteProtection } from '../../hooks/useRouteProtection'

function VerdictBadge({ status }: { status: string }) {
  if (status === 'passed' || status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="w-3.5 h-3.5" />
        Passed
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="w-3.5 h-3.5" />
        Failed
      </span>
    )
  }
  if (status === 'aqa_running' || status === 'reviewing') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock className="w-3.5 h-3.5" />
        Running
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <Clock className="w-3.5 h-3.5" />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function ProjectMilestoneSection({ project }: { project: Project }) {
  const { data: milestones, isLoading } = useGetProjectMilestonesQuery(project.project_id)

  const reviewedMilestones = milestones?.filter(m =>
    ['passed', 'failed', 'paid', 'aqa_running', 'reviewing'].includes(m.status)
  ) ?? []

  if (isLoading) {
    return (
      <div className="py-6 flex justify-center">
        <div className="w-5 h-5 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (reviewedMilestones.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 px-6">No AI reviews yet for this project.</p>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {reviewedMilestones.map(milestone => (
        <div
          key={milestone.milestone_id}
          className="flex items-center justify-between py-3 px-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Bot className="w-4 h-4 text-[#AD7D56] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{milestone.title}</p>
              <p className="text-xs text-gray-500">
                ₹{milestone.payment_amount.toLocaleString()} &middot; Due{' '}
                {new Date(milestone.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <VerdictBadge status={milestone.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AIReviewsPage() {
  useRouteProtection()
  const { data: projects, isLoading, isError, refetch } = useGetProjectsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Loading AI reviews...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">Failed to load AI reviews</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">AI Reviews</h1>
            <p className="text-gray-600 mt-1">
              Automated quality assessments for your milestone submissions
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Empty state */}
      {(!projects || projects.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm"
        >
          <Bot className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Reviews Yet</h3>
          <p className="text-gray-500 text-center max-w-sm">
            AI reviews appear here after you submit milestone work and the automated quality system
            evaluates it.
          </p>
        </motion.div>
      )}

      {/* Projects list */}
      {projects && projects.length > 0 && (
        <div className="space-y-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.project_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* Project header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {project.name || `Project #${project.project_id.slice(0, 8)}`}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    ₹{project.total_price.toLocaleString()} &middot; {project.timeline_days} days
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : project.status === 'completed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {project.status || 'pending'}
                </span>
              </div>

              {/* Milestone AQA results */}
              <ProjectMilestoneSection project={project} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Legend */}
      {projects && projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
        >
          <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
            Verdict Legend
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <CheckCircle className="w-3.5 h-3.5" />
              Passed — AQA check succeeded
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <XCircle className="w-3.5 h-3.5" />
              Failed — AQA check failed
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              <Clock className="w-3.5 h-3.5" />
              Running — AQA in progress
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
