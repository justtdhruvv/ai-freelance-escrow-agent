'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, CreditCard, Banknote, Shield } from 'lucide-react'

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

interface FundEscrowModalProps {
  project: Project
  onClose: () => void
}

export default function FundEscrowModal({ project, onClose }: FundEscrowModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay with Visa, Mastercard, or other cards'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Banknote,
      description: 'Direct bank transfer from your account'
    },
    {
      id: 'wallet',
      name: 'Wallet Balance',
      icon: Wallet,
      description: 'Use your existing wallet balance'
    }
  ]

  const handleFundEscrow = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Funding escrow:', {
      projectId: project.id,
      amount: parseFloat(amount),
      paymentMethod
    })
    
    setIsProcessing(false)
    onClose()
  }

  const remainingAmount = project.totalEscrowAmount - (project.totalEscrowAmount * 0.3) // Assuming 30% already funded

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
            <div>
              <h2 className="text-2xl font-semibold text-[#111111]">Fund Escrow</h2>
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

          <form onSubmit={handleFundEscrow} className="p-6 space-y-6">
            {/* Project Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-[#AD7D56]" />
                <h3 className="font-medium text-[#111111]">Escrow Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Escrow Amount:</span>
                  <span className="font-medium text-[#111111]">${project.totalEscrowAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Already Funded:</span>
                  <span className="font-medium text-green-600">${(project.totalEscrowAmount * 0.3).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                  <span>Remaining to Fund:</span>
                  <span className="text-[#AD7D56]">${remainingAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                max={remainingAmount}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
                placeholder={`Enter amount (max: $${remainingAmount.toLocaleString()})`}
              />
              {amount && parseFloat(amount) > remainingAmount && (
                <p className="text-red-600 text-sm mt-1">Amount exceeds remaining balance</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <motion.div
                    key={method.id}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === method.id
                        ? 'border-[#AD7D56] bg-[#AD7D56]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <method.icon className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-[#111111]">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === method.id
                          ? 'border-[#AD7D56] bg-[#AD7D56]'
                          : 'border-gray-300'
                      }`}>
                        {paymentMethod === method.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Secure Escrow Protection</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your funds are held in secure escrow until project milestones are completed and approved. 
                    We guarantee payment protection for both clients and freelancers.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isProcessing}
              >
                Cancel
              </motion.button>

              <motion.button
                type="submit"
                className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isProcessing || !amount || parseFloat(amount) > remainingAmount}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Fund $${amount || '0'}`
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
