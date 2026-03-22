'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, DollarSign, FileText, Users } from 'lucide-react'
import { useGetClientsQuery } from '../store/api/clientsApi'
import { useCreateProjectMutation } from '../store/api/projectsApi'

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess?: () => void // ✅ optional
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {

  const [formData, setFormData] = useState({
    name: '',
    total_price: 0,
    timeline_days: 0,
    client_id: '',
    description: '',
    deadline: ''
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
      [name]: name === 'total_price' || name === 'timeline_days'
        ? Number(value)
        : value
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
    if (formData.total_price <= 0) {
      setError('Enter valid budget')
      return false
    }
    if (formData.timeline_days <= 0) {
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
        total_price: formData.total_price,
        timeline_days: formData.timeline_days,
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded">
                {error}
              </div>
            )}

            {/* Project Name */}
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Project name"
              className="w-full p-2 border rounded"
            />

            {/* Client */}
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select client</option>
              {clients.map((c: any) => (
                <option key={c.user_id} value={c.user_id}>
                  {c.email}
                </option>
              ))}
            </select>

            {/* Budget */}
            <input
              type="number"
              name="total_price"
              value={formData.total_price}
              onChange={handleInputChange}
              placeholder="Budget"
              className="w-full p-2 border rounded"
            />

            {/* Timeline */}
            <input
              type="number"
              name="timeline_days"
              value={formData.timeline_days}
              onChange={handleInputChange}
              placeholder="Timeline"
              className="w-full p-2 border rounded"
            />

            {/* Buttons */}
            <div className="flex gap-4">
              <button type="button" onClick={onClose}>
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#AD7D56] text-white px-4 py-2 rounded"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}