'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Code, Palette, PenTool, Settings } from 'lucide-react'
import { useState } from 'react'
import { useAddProjectBriefMutation } from '../store/api/projectsApi'

interface CreateProjectBriefModalProps {
  onClose: () => void
  onSuccess: () => void
  projectId: string
}

const domainOptions = [
  { value: 'code', label: 'Code', icon: Code },
  { value: 'design', label: 'Design', icon: Palette },
  { value: 'content', label: 'Content', icon: PenTool },
  { value: 'general', label: 'General', icon: Settings }
]

export default function CreateProjectBriefModal({ 
  onClose, 
  onSuccess, 
  projectId 
}: CreateProjectBriefModalProps) {
  const [formData, setFormData] = useState({
    raw_text: '',
    domain: 'general' as 'code' | 'design' | 'content' | 'general'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [addProjectBrief] = useAddProjectBriefMutation()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.raw_text.trim()) {
      setError('Project brief is required')
      return false
    }
    if (!formData.domain) {
      setError('Please select a domain')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      await addProjectBrief({
        projectId,
        data: formData
      }).unwrap()
      
      console.log('Project brief created:', {
        projectId,
        raw_text: formData.raw_text,
        domain: formData.domain
      })
      
      onSuccess()
      onClose()
    } catch (err) {
      setError('Failed to create project brief. Please try again.')
      console.error('Create project brief error:', err)
    } finally {
      setLoading(false)
    }
  }

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
          className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#AD7D56]/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#AD7D56]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Add Project Brief</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Domain Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {domainOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <label
                      key={option.value}
                      className={`
                        relative flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${formData.domain === option.value 
                          ? 'border-[#AD7D56] bg-[#AD7D56]/5' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="domain"
                        value={option.value}
                        checked={formData.domain === option.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Client Brief */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Brief <span className="text-red-500">*</span>
              </label>
              <textarea
                name="raw_text"
                value={formData.raw_text}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent resize-none"
                placeholder="Describe the project requirements, goals, and deliverables..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Brief'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
