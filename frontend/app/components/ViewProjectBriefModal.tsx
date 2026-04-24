'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Code, Palette, PenTool, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { TokenManager } from '../utils/authToken'
import { ProjectBrief } from '../../types/project'
import { API_URL } from '../utils/apiUrl'

interface ViewProjectBriefModalProps {
  onClose: () => void
  projectId: string
}

const domainIcons = {
  code: Code,
  design: Palette,
  content: PenTool,
  general: Settings
}

const domainLabels = {
  code: 'Code',
  design: 'Design',
  content: 'Content',
  general: 'General'
}

export default function ViewProjectBriefModal({ 
  onClose, 
  projectId 
}: ViewProjectBriefModalProps) {
  const [briefs, setBriefs] = useState<ProjectBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        setLoading(true)
        
        // Debug: Check token availability
        console.log('=== ViewProjectBriefModal Debug ===')
        TokenManager.debugToken()
        
        // Get auth headers using TokenManager
        const authHeaders = TokenManager.getAuthHeader()
        console.log('Auth headers:', authHeaders)
        
        const response = await fetch(`${API_URL}/projects/${projectId}/brief`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          }
        })
        
        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers)
        
        if (!response.ok) {
          throw new Error('Failed to fetch project briefs')
        }
        const data = await response.json()
        console.log('API Response:', data)
        
        // Handle different response formats
        let briefsData = []
        if (Array.isArray(data)) {
          briefsData = data
        } else if (data.briefs) {
          briefsData = data.briefs
        } else if (data.brief) {
          briefsData = Array.isArray(data.brief) ? data.brief : [data.brief]
        } else if (data.brief_id) {
          // Handle single brief object response
          briefsData = [data]
        } else {
          briefsData = []
        }
        
        console.log('Processed briefs data:', briefsData)
        setBriefs(briefsData)
      } catch (err) {
        setError('Failed to load project briefs')
        console.error('Fetch briefs error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchBriefs()
    }
  }, [projectId])

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
          className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#AD7D56]/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#AD7D56]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Project Briefs</h2>
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
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AD7D56]"></div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && briefs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Briefs</h3>
                <p className="text-gray-500">This project doesn't have any briefs yet.</p>
              </div>
            )}

            {!loading && !error && briefs.length > 0 && (
              <div className="space-y-4">
                {briefs.map((brief, index) => {
                  const Icon = domainIcons[brief.domain as keyof typeof domainIcons]
                  const label = domainLabels[brief.domain as keyof typeof domainLabels]
                  
                  return (
                    <motion.div
                      key={brief.brief_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Brief Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {label}
                            </span>
                            {brief.ai_processed === 1 && (
                              <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                AI Processed
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(brief.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Brief Content */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {brief.raw_text}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
