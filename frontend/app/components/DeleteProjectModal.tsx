'use client'



import { useState } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import { X, AlertTriangle, Trash2 } from 'lucide-react'

import { projectService, Project } from '../services/projectService'



interface DeleteProjectModalProps {

  project: Project

  onClose: () => void

  onSuccess: () => void

}



export default function DeleteProjectModal({ project, onClose, onSuccess }: DeleteProjectModalProps) {

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const [confirmText, setConfirmText] = useState('')



  const handleDelete = async () => {

    if (confirmText !== project.title) {

      setError('Please type the project title correctly to confirm deletion')

      return

    }



    setLoading(true)

    setError('')



    try {

      await projectService.deleteProject(project.id)

      onSuccess()

      onClose()

    } catch (err) {

      setError('Failed to delete project. Please try again.')

      console.error('Delete project error:', err)

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

          className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl"

        >

          <div className="flex items-center justify-between p-6 border-b border-gray-200">

            <h2 className="text-xl font-semibold text-gray-900">Delete Project</h2>

            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">

              <X className="w-5 h-5 text-gray-500" />

            </button>

          </div>



          <div className="p-6 space-y-4">

            {/* Warning Icon and Message */}

            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">

              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />

              <div>

                <p className="font-medium text-red-900">This action cannot be undone</p>

                <p className="text-sm text-red-700 mt-1">

                  Deleting this project will permanently remove all associated data.

                </p>

              </div>

            </div>



            {/* Project Details */}

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">

              <h3 className="font-medium text-gray-900 mb-2">Project to be deleted:</h3>

              <div className="space-y-1">

                <div className="flex justify-between">

                  <span className="text-sm text-gray-600">Title:</span>

                  <span className="text-sm font-medium text-gray-900">{project.title}</span>

                </div>

                <div className="flex justify-between">

                  <span className="text-sm text-gray-600">Client:</span>

                  <span className="text-sm font-medium text-gray-900">{project.clientEmail}</span>

                </div>

                <div className="flex justify-between">

                  <span className="text-sm text-gray-600">Budget:</span>

                  <span className="text-sm font-medium text-gray-900">${project.budget.toLocaleString()}</span>

                </div>

              </div>

            </div>



            {/* Confirmation Input */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Type <span className="font-mono bg-gray-100 px-1 rounded">"{project.title}"</span> to confirm

              </label>

              <input

                type="text"

                value={confirmText}

                onChange={(e) => setConfirmText(e.target.value)}

                placeholder="Enter project title"

                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"

              />

            </div>



            {/* Error Message */}

            {error && (

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">

                {error}

              </div>

            )}



            {/* Actions */}

            <div className="flex gap-3 pt-2">

              <button

                type="button"

                onClick={onClose}

                disabled={loading}

                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"

              >

                Cancel

              </button>

              <motion.button

                onClick={handleDelete}

                disabled={loading || confirmText !== project.title}

                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"

                whileHover={{ scale: (loading || confirmText !== project.title) ? 1 : 1.02 }}

                whileTap={{ scale: (loading || confirmText !== project.title) ? 1 : 0.98 }}

              >

                {loading ? (

                  'Deleting...'

                ) : (

                  <>

                    <Trash2 className="w-4 h-4" />

                    Delete Project

                  </>

                )}

              </motion.button>

            </div>

          </div>

        </motion.div>

      </div>

    </AnimatePresence>

  )

}

