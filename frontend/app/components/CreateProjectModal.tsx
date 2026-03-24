'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, DollarSign, FileText, Users, Github } from 'lucide-react'
import { useGetClientsQuery } from '../store/api/clientsApi'
import { useCreateProjectMutation } from '../store/api/projectsApi'

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess?: () => void // ✅ optional
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {

  const [formData, setFormData] = useState({
    name: '',
    total_price: '',
    timeline_days: '',
    client_id: '',
    description: '',
    deadline: '',
    repo_link: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: clientsData } = useGetClientsQuery()
  const clients = clientsData?.clients || []

  const [createProject] = useCreateProjectMutation()

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name) {
      setError('Project name is required')
      return false
    }
    if (!formData.client_id) {
      setError('Select a client')
      return false
    }
    if (Number(formData.total_price) <= 0) {
      setError('Enter valid budget')
      return false
    }
    if (Number(formData.timeline_days) <= 0) {
      setError('Enter valid timeline')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        client_id: formData.client_id,
        total_price: Number(formData.total_price),
        timeline_days: Number(formData.timeline_days),
        repo_link: formData.repo_link
      }

      await createProject(payload).unwrap()

      console.log("Project created:", payload)

      onSuccess?.() // ✅ safe call
      onClose()

    } catch (err) {
      console.error(err)
      setError("Failed to create project")
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
          className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl"
        >

          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Create New Project</h2>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <div className="relative">
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent outline-none appearance-none"
                >
                  <option value="">Select client</option>
                  {clients.map((c: any) => (
                    <option key={c.user_id} value={c.user_id}>
                      {c.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget (INR ₹) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  name="total_price"
                  value={formData.total_price}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeline (Days)
              </label>
              <input
                type="number"
                name="timeline_days"
                value={formData.timeline_days}
                onChange={handleInputChange}
                placeholder="e.g. 14"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent outline-none"
              />
            </div>

            {/* Repository Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository Link
              </label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  name="repo_link"
                  value={formData.repo_link}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repo"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">

              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>

            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}