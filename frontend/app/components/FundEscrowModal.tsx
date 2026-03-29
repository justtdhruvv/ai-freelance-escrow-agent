'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, CreditCard, Banknote, Shield } from 'lucide-react'
import { useGetRazorpayKeyQuery, useCreateEscrowMutation, useConfirmPaymentMutation } from '../store/api/paymentApi'

interface Project {
  project_id: string
  name?: string
  employer_id: string
  freelancer_id: string
  total_price: number
  timeline_days: number
  status: 'draft' | 'active' | 'completed' | 'review' | 'disputed'
  created_at?: string
  repo_link?: string
  brief?: {
    raw_text: string
    domain: string
  }
}

interface FundEscrowModalProps {
  project: Project
  onClose: () => void
}

export default function FundEscrowModal({ project, onClose }: FundEscrowModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Get Razorpay key for payment
  const { data: razorpayData } = useGetRazorpayKeyQuery()
  const [createEscrow, { isLoading: isCreatingEscrow }] = useCreateEscrowMutation()
  const [confirmPayment, { isLoading: isConfirmingPayment }] = useConfirmPaymentMutation()

  // Use project's fixed total_price
  const escrowAmount = project.total_price || 0
  const remainingAmount = escrowAmount // Full amount needed

  const handleFundEscrow = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (escrowAmount <= 0) {
      return
    }

    setIsProcessing(true)

    try {
      // Check if Razorpay key is available
      if (!razorpayData?.key_id) {
        throw new Error('Payment gateway not configured. Please contact support.')
      }

      // Create escrow order first
      const escrowResult = await createEscrow({
        projectId: project.project_id,
        amount: escrowAmount * 100, // Convert to cents
        description: `Escrow funding for ${project.name || 'Project'}`
      }).unwrap()

      console.log('Escrow order created:', escrowResult)

      // Initialize Razorpay payment
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        console.log('=== Razorpay Configuration Debug ===')
        console.log('Razorpay available:', !!(window as any).Razorpay)
        console.log('Escrow order created:', escrowResult)
        console.log('Razorpay key:', razorpayData?.key_id)
        console.log('Amount:', escrowAmount * 100)
        
        const options = {
          key: razorpayData.key_id, // Use key_id from backend response
          amount: escrowAmount * 100, // Amount in paise/cents
          currency: 'INR',
          name: project.name || 'Project Funding',
          description: `Escrow funding for project ${project.project_id}`,
          image: 'https://example.com/your-logo.png',
          order_id: escrowResult.order_id, // ✅ Add order_id to options
          handler: async function (response: any) {
            console.log('=== Razorpay Handler Called ===')
            console.log('Payment successful - handler triggered!')
            console.log('Full response object:', JSON.stringify(response, null, 2))
            console.log('Response keys:', Object.keys(response))
            console.log('Response properties:', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            try {
              console.log('Razorpay payment successful:', response)
              
              // Confirm payment with backend
              // Check if response has expected fields
              if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
                console.error('Missing required fields in Razorpay response')
                console.error('Available fields:', Object.keys(response))
                alert('Payment response is incomplete. Please contact support.')
                setIsProcessing(false)
                return
              }

              const confirmPayload = {
                order_id: response.razorpay_order_id,  // ✅ Use order_id from Razorpay response
                payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
              
              console.log('=== Payment Confirmation Debug ===')
              console.log('Full Razorpay Response:', response)
              console.log('Escrow Result:', escrowResult)
              console.log('Order ID from escrow:', escrowResult.order_id)
              console.log('Order ID from Razorpay response:', response.razorpay_order_id)
              console.log('Payment ID from Razorpay:', response.razorpay_payment_id)
              console.log('Signature from Razorpay:', response.razorpay_signature)
              console.log('Final Payload to send:', confirmPayload)
              console.log('Payload keys:', Object.keys(confirmPayload))
              console.log('All fields present:', 
                !!confirmPayload.order_id, 
                !!confirmPayload.payment_id, 
                !!confirmPayload.razorpay_signature
              )
              console.log('==================================')
              
              await confirmPayment(confirmPayload).unwrap()

              console.log('Payment confirmed with backend')
              onClose()
            } catch (error: any) {
              console.error('Payment confirmation failed:', error)
              console.error('Error details:', {
                status: error.status,
                data: error.data,
                error: error.error
              })
              
              // Show specific error message from backend if available
              const errorMessage = error.data?.error || error.message || 'Unknown error occurred'
              alert(`Payment confirmation failed: ${errorMessage}`)
            } finally {
              setIsProcessing(false)
            }
          },
          modal: {
            ondismiss: function() {
              console.log('Razorpay modal dismissed')
              setIsProcessing(false)
            }
          },
          theme: {
            color: '#AD7D56'
          }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        throw new Error('Payment gateway not available. Please refresh the page.')
      }

    } catch (error: any) {
      console.error('Failed to create escrow:', error)
      alert(`Payment failed: ${error.data?.error || error.message || 'Unknown error'}`)
      setIsProcessing(false)
    }
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
                  <span className="text-gray-600">Project Total:</span>
                  <span className="font-medium text-[#111111]">₹{escrowAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                  <span>Amount to Fund:</span>
                  <span className="text-[#AD7D56]">₹{escrowAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-1 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                    disabled={isCreatingEscrow}
                  />
                  <div className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Credit/Debit Card</div>
                      <div className="text-sm text-gray-500">Pay with Visa, Mastercard, or other cards</div>
                    </div>
                  </div>
                </label>
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
                disabled={isProcessing || isCreatingEscrow || escrowAmount <= 0}
              >
                {isProcessing || isCreatingEscrow ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Fund ₹${escrowAmount.toLocaleString('en-IN')}`
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
