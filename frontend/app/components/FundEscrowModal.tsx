'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, CheckCircle } from 'lucide-react'
import { useFundProjectMutation } from '../store/api/paymentApi'

interface Project {
  project_id: string
  name?: string
  employer_id: string
  freelancer_id: string
  total_price: number
  timeline_days: number
  status: string
  created_at?: string
  repo_link?: string
}

interface FundEscrowModalProps {
  project: Project
  onClose: () => void
  onSuccess?: () => void
}

export default function FundEscrowModal({ project, onClose, onSuccess }: FundEscrowModalProps) {
  const [fundProject, { isLoading }] = useFundProjectMutation()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const amount = project.total_price || 0
  const displayAmount = (amount / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })

  const handleFund = async () => {
    setError('')
    try {
      await fundProject({ projectId: project.project_id }).unwrap()
      setDone(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 1800)
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.details || 'Failed to fund project. Please try again.')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Fund Escrow</h2>
              <p className="text-gray-500 text-sm mt-0.5">{project.name || `Project ${project.project_id.slice(0, 8)}`}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {done ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle className="w-14 h-14 text-green-500 mb-3" />
                <p className="text-lg font-semibold text-gray-900">Project Funded!</p>
                <p className="text-gray-500 text-sm mt-1">{displayAmount} is now held in escrow.</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-[#AD7D56]" />
                    <h3 className="font-medium text-gray-900">Escrow Summary</h3>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount to lock in escrow:</span>
                    <span className="font-bold text-[#AD7D56]">{displayAmount}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-medium mb-1">How escrow works</p>
                  <p>Funds are locked in escrow when you confirm. They are automatically released to the freelancer only when milestones pass quality checks.</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  This is a <strong>simulated payment</strong> — no real money is charged.
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFund}
                    disabled={isLoading || amount <= 0}
                    className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors disabled:opacity-50 font-medium"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Fund ${displayAmount}`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
