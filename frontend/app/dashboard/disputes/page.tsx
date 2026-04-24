'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useGetMyDisputesQuery, useResolveDisputeMutation, Dispute } from '../../store/api/projectsApi'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  open: { label: 'Open', bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertTriangle },
  under_review: { label: 'Under Review', bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
  resolved: { label: 'Resolved', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle },
}

const TYPE_LABELS: Record<string, string> = {
  quality: 'Quality Issues',
  aqa_conflict: 'AQA Result Conflict',
  deadline: 'Deadline Missed',
  scope: 'Scope Disagreement',
  payment: 'Payment Issues',
  communication: 'Communication',
  other: 'Other',
}

function DisputeCard({ dispute, canResolve }: { dispute: Dispute; canResolve: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [resolution, setResolution] = useState('')
  const [resolveDispute, { isLoading }] = useResolveDisputeMutation()

  const config = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open
  const StatusIcon = config.icon

  const handleResolve = async () => {
    if (!resolution.trim()) return
    try {
      await resolveDispute({ disputeId: dispute.dispute_id, resolution: resolution.trim() }).unwrap()
      setResolution('')
    } catch (err) {
      console.error('Failed to resolve dispute', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {TYPE_LABELS[dispute.dispute_type] || dispute.dispute_type}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-mono truncate">
              Project: {dispute.project_id.substring(0, 16)}...
            </p>
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{dispute.description}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span>Opened {new Date(dispute.created_at).toLocaleDateString()}</span>
          {dispute.resolved_at && <span>Resolved {new Date(dispute.resolved_at).toLocaleDateString()}</span>}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {dispute.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
              <p className="text-sm text-green-800">{dispute.resolution}</p>
            </div>
          )}

          {canResolve && dispute.status === 'open' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resolve Dispute</p>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="Describe the resolution..."
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <button
                onClick={handleResolve}
                disabled={isLoading || !resolution.trim()}
                className="mt-2 px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Resolving...' : 'Mark as Resolved'}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function DisputesPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const { data: disputes, isLoading, error } = useGetMyDisputesQuery()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = disputes?.filter(d => statusFilter === 'all' || d.status === statusFilter) || []

  const counts = {
    all: disputes?.length || 0,
    open: disputes?.filter(d => d.status === 'open').length || 0,
    under_review: disputes?.filter(d => d.status === 'under_review').length || 0,
    resolved: disputes?.filter(d => d.status === 'resolved').length || 0,
  }

  return (
    <div className="bg-white p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500 mt-1">Track and manage your project disputes</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'all', label: 'Total', color: 'text-gray-700', bg: 'bg-gray-50' },
          { key: 'open', label: 'Open', color: 'text-orange-700', bg: 'bg-orange-50' },
          { key: 'under_review', label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-50' },
          { key: 'resolved', label: 'Resolved', color: 'text-green-700', bg: 'bg-green-50' },
        ].map(({ key, label, color, bg }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-xl p-4 text-left transition-all border-2 ${statusFilter === key ? 'border-[#AD7D56]' : 'border-transparent'} ${bg}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{counts[key as keyof typeof counts]}</p>
            <p className={`text-sm font-medium ${color} opacity-75`}>{label}</p>
          </button>
        ))}
      </div>

      {/* Disputes list */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin" />
          <p className="ml-3 text-gray-500">Loading disputes...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-red-500">Failed to load disputes</div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No disputes found</h3>
          <p className="text-gray-500 text-sm">
            {statusFilter === 'all' ? 'You have no disputes yet.' : `No ${statusFilter.replace('_', ' ')} disputes.`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((dispute) => (
          <DisputeCard
            key={dispute.dispute_id}
            dispute={dispute}
            canResolve={user?.role === 'freelancer'}
          />
        ))}
      </div>
    </div>
  )
}
