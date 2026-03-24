'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Check, X as XIcon, Clock, Lock, User, Building } from 'lucide-react'
import { useState, useEffect } from 'react'
import { 
  useGetVerificationContractQuery, 
  useApproveClientContractMutation, 
  useApproveFreelancerContractMutation,
  useGetUserProfileQuery
} from '../store/api/projectsApi'

interface ContractModalProps {
  onClose: () => void
  projectId: string
}

export default function ContractModal({ 
  onClose, 
  projectId
}: ContractModalProps) {
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch user profile to determine role
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    error: profileError 
  } = useGetUserProfileQuery()

  const { 
    data: contract, 
    isLoading, 
    error, 
    refetch 
  } = useGetVerificationContractQuery(projectId)

  const [approveClientContract] = useApproveClientContractMutation()
  const [approveFreelancerContract] = useApproveFreelancerContractMutation()

  // Determine user role from profile
  const userRole = userProfile?.role === 'employer' ? 'client' : 'freelancer'

  const handleApprove = async () => {
    if (!contract) return

    try {
      setSuccessMessage('')
      setErrorMessage('')

      // Use the correct API based on user role
      if (userProfile?.role === 'employer') {
        await approveClientContract(contract.verification_contract_id).unwrap()
        setSuccessMessage('Contract approved successfully!')
      } else if (userProfile?.role === 'freelancer') {
        await approveFreelancerContract(contract.verification_contract_id).unwrap()
        setSuccessMessage('Contract approved successfully!')
      } else {
        setErrorMessage('Unable to determine user role. Please refresh and try again.')
        return
      }

      // Refetch contract data
      setTimeout(() => {
        refetch()
        setSuccessMessage('')
      }, 2000)

    } catch (err) {
      setErrorMessage('Failed to approve contract. Please try again.')
      console.error('Approve contract error:', err)
    }
  }

  const getStatusColor = () => {
    if (contract?.isLocked === 1) return 'bg-green-100 text-green-800 border-green-200'
    if (contract?.freelancer_approved === 1 && contract?.client_approved === 1) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (contract?.freelancer_approved === 1 || contract?.client_approved === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusText = () => {
    if (contract?.isLocked === 1) return 'Contract Locked'
    if (contract?.freelancer_approved === 1 && contract?.client_approved === 1) return 'Both Approved'
    if (contract?.freelancer_approved === 1 && contract?.client_approved === 0) return 'Pending Client Approval'
    if (contract?.freelancer_approved === 0 && contract?.client_approved === 1) return 'Pending Freelancer Approval'
    return 'Pending Approval'
  }

  const canApprove = () => {
    if (!contract || contract.isLocked === 1 || !userProfile) return false
    
    if (userProfile.role === 'employer') {
      return contract.client_approved === 0
    } else if (userProfile.role === 'freelancer') {
      return contract.freelancer_approved === 0
    }
    
    return false
  }

  const getApprovalStatus = () => {
    if (!contract) return { client: false, freelancer: false }
    
    return {
      client: contract.client_approved === 1,
      freelancer: contract.freelancer_approved === 1
    }
  }

  const approvalStatus = getApprovalStatus()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl mx-4 bg-white rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#AD7D56]/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#AD7D56]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Verification Contract</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                  {contract?.isLocked === 1 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {profileLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AD7D56]"></div>
              </div>
            )}

            {profileError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                Failed to load user profile. Please refresh and try again.
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AD7D56]"></div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                Failed to load contract. Please try again.
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm mb-4">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {errorMessage}
              </div>
            )}

            {!profileLoading && !profileError && !isLoading && !error && contract && userProfile && (
              <div className="space-y-6">
                {/* Approval Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      approvalStatus.client ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Building className={`w-5 h-5 ${
                        approvalStatus.client ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Client</p>
                      <p className="text-xs text-gray-500">
                        {approvalStatus.client ? 'Approved' : 'Pending'}
                      </p>
                    </div>
                    {approvalStatus.client && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      approvalStatus.freelancer ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <User className={`w-5 h-5 ${
                        approvalStatus.freelancer ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Freelancer</p>
                      <p className="text-xs text-gray-500">
                        {approvalStatus.freelancer ? 'Approved' : 'Pending'}
                      </p>
                    </div>
                    {approvalStatus.freelancer && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>

                {/* Contract Policy */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">EscrowAI Agreement Policy</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="prose prose-sm max-w-none">
                      {contract.policy.split('\n').map((line, index) => (
                        <p key={index} className="text-gray-700 leading-relaxed mb-2">
                          {line || <br />}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contract Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Contract ID</p>
                    <p className="font-medium text-gray-900">{contract.contract_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {canApprove() && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleApprove}
                      className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve Contract
                    </button>
                  </div>
                )}

                {/* Locked State Message */}
                {contract.isLocked === 1 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Lock className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Contract is Locked</p>
                      <p className="text-xs text-green-600">Both parties have approved this contract. It cannot be modified.</p>
                    </div>
                  </div>
                )}

                {/* Pending Approval Message */}
                {!canApprove() && contract.isLocked === 0 && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Waiting for Approval</p>
                      <p className="text-xs text-yellow-600">
                        {userProfile?.role === 'employer' 
                          ? 'Waiting for freelancer to approve the contract.'
                          : userProfile?.role === 'freelancer'
                          ? 'Waiting for client to approve the contract.'
                          : 'Waiting for the other party to approve the contract.'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
