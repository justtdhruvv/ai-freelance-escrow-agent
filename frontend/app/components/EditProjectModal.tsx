'use client'



import { useState, useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import { X, Calendar, DollarSign, User, FileText } from 'lucide-react'

import { projectService, Project, UpdateProjectData } from '../services/projectService'



interface EditProjectModalProps {

  project: Project

  onClose: () => void

  onSuccess: () => void

}



export default function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {

  const [formData, setFormData] = useState<UpdateProjectData>({

    title: project.title,

    clientEmail: project.clientEmail,

    description: project.description,

    budget: project.budget,

    status: project.status,

    deadline: project.deadline,

  })



  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {

    const { name, value } = e.target

    setFormData(prev => ({

      ...prev,

      [name]: name === 'budget' ? Number(value) : value

    }))

  }



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    setLoading(true)

    setError('')



    try {

      await projectService.updateProject(project.id, formData)

      onSuccess()

      onClose()

    } catch (err) {

      setError('Failed to update project. Please try again.')

      console.error('Update project error:', err)

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

          className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"

        >

          <div className="flex items-center justify-between p-6 border-b border-gray-200">

            <h2 className="text-xl font-semibold text-gray-900">Edit Project</h2>

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



            {/* Client Email Dropdown */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Client Email *

              </label>

              <select

                name="clientEmail"

                value={formData.clientEmail}

                onChange={handleInputChange}

                required

                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"

              >

                <option value="">Select a client</option>

                <option value="client1@gmail.com">client1@gmail.com</option>

                <option value="client2@gmail.com">client2@gmail.com</option>

                <option value="client3@gmail.com">client3@gmail.com</option>

                <option value="client4@gmail.com">client4@gmail.com</option>

                <option value="client5@gmail.com">client5@gmail.com</option>

              </select>

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



            {/* Budget, Status, and Deadline */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Budget */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Budget ($)

                </label>

                <div className="relative">

                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

                  <input

                    type="number"

                    name="budget"

                    value={formData.budget}

                    onChange={handleInputChange}

                    required

                    min="0"

                    step="0.01"

                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"

                    placeholder="0.00"

                  />

                </div>

              </div>



              {/* Status */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Status

                </label>

                <select

                  name="status"

                  value={formData.status}

                  onChange={handleInputChange}

                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56]"

                >

                  <option value="active">Active</option>

                  <option value="completed">Completed</option>

                  <option value="review">In Review</option>

                  <option value="disputed">Disputed</option>

                </select>

              </div>

            </div>



            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>

              <div className="relative">

                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

                <input

                  type="date"

                  name="deadline"

                  value={formData.deadline}

                  onChange={handleInputChange}

                  required

                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56]"

                />

              </div>

            </div>



            <div className="flex gap-3 pt-4">

              <button

                type="button"

                onClick={onClose}

                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"

              >

                Cancel

              </button>

              <motion.button

                type="submit"

                disabled={loading}

                className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] disabled:opacity-50"

                whileHover={{ scale: loading ? 1 : 1.02 }}

                whileTap={{ scale: loading ? 1 : 0.98 }}

              >

                {loading ? 'Updating...' : 'Update Project'}

              </motion.button>

            </div>

          </form>

        </motion.div>

      </div>

    </AnimatePresence>

  )

}

