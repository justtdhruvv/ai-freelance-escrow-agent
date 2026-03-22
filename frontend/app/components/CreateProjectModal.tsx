'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, DollarSign, FileText, Users } from 'lucide-react'
import { useGetClientsQuery } from '../store/api/clientsApi'
import { useCreateProjectMutation } from '../store/api/projectsApi'
import { div } from 'framer-motion/client'

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    total_price: 0,
    timeline_days: 0,
    client_id: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch clients for dropdown
  const { data: clientsData } = useGetClientsQuery()
  const clients = clientsData?.clients || []

  // Get mutation hook
  const [createProject] = useCreateProjectMutation()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_price' || name === 'timeline_days' ? Number(value) : value
    }))
  }

  const validateForm = () => {
    if (!formData.client_id) {
      setError('Please select a client for this project')
      return false
    }
    if (formData.total_price <= 0) {
      setError('Please enter a valid project budget')
      return false
    }
    if (formData.timeline_days <= 0) {
      setError('Please enter a valid timeline in days')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      await createProject.mutateAsync(formData)
      
      console.log('Project created with data:', {
        client_id: formData.client_id,
        total_price: formData.total_price,
        timeline_days: formData.timeline_days
      })
      
      onSuccess()
      onClose()
    } catch (err) {
      setError('Failed to create project. Please try again.')
      console.error('Create project error:', err)
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

          className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"

        >

          <div className="flex items-center justify-between p-6 border-b border-gray-200">

            <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>

            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">

              <X className="w-5 h-5 text-gray-500" />

            </button>

          </div>



          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {error && (

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">

                {error}

              </div>

            )}



            {/* Project Title */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Project Title *

              </label>

              <div className="relative">

                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

                <input

                  type="text"

                  name="title"

                  value={formData.title}

                  onChange={handleInputChange}

                  required

                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"

                  placeholder="Enter project title"

                />

              </div>

            </div>



            {/* Client Selection */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.user_id} value={client.user_id}>
                      {client.email} (PFI: {client.pfi_score})
                    </option>
                  ))}
                </select>
              </div>
              {clients.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600">
                  No clients available. Please add a client first.
                </p>
              )}
            </div>



            {/* Project Budget */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  name="total_price"
                  value={formData.total_price}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
                  placeholder="1000.00"
                />
              </div>
            </div>



            {/* Timeline */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeline (days) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  name="timeline_days"
                  value={formData.timeline_days}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
                  placeholder="30"
                />
              </div>
            </div>



            {/* Description */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Description

              </label>

              <textarea

                name="description"

                value={formData.description}

                onChange={handleInputChange}

                required

                rows={3}

                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent resize-none"

                placeholder="Enter project description"

              />

            </div>


              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Deadline

                </label>

                <div className="relative">

                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

                  <input

                    type="date"

                    name="deadline"

                    value={formData.deadline}

                    onChange={handleInputChange}

                    required

                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"

                  />

                </div>

              </div>




            {/* Action Buttons */}

            <div className="flex gap-4 pt-4">

              <motion.button

                type="button"

                onClick={onClose}

                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"

                whileHover={{ scale: 1.02 }}

                whileTap={{ scale: 0.98 }}

              >

                Cancel

              </motion.button>

              <motion.button

                type="submit"

                disabled={loading}

                className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] disabled:opacity-50 disabled:cursor-not-allowed"

                whileHover={{ scale: loading ? 1 : 1.02 }}

                whileTap={{ scale: loading ? 1 : 0.98 }}

              >

                {loading ? 'Creating...' : 'Create Project'}

              </motion.button>

            </div>

          </form>

        </motion.div>

      </div>

    </AnimatePresence>

  )

}

