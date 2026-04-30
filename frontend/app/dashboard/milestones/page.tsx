'use client'



import { useState, useEffect } from 'react'

import { motion } from 'framer-motion'

import { Target, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, RefreshCw, ChevronDown, Github, ExternalLink, Send, Play } from 'lucide-react'

import { useGetProjectsQuery, useGetProjectMilestonesQuery, useSubmitMilestoneMutation, useRunAQAsMutation } from '../../store/api/projectsApi'
import { useRouteProtection } from '../../hooks/useRouteProtection'



export default function MilestonesPage() {

  useRouteProtection()

  const [selectedProjectId, setSelectedProjectId] = useState<string>('')

  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  const [showAQAModal, setShowAQAModal] = useState(false)

  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)

  const [submissionForm, setSubmissionForm] = useState({

    type: 'code' as 'code' | 'design' | 'documentation' | 'other',

    repo_url: '',

    content: ''

  })

  const [milestoneSubmissions, setMilestoneSubmissions] = useState<Record<string, any>>({})

  const [aqaResults, setAqaResults] = useState<Record<string, any>>({})

  const [milestoneStatuses, setMilestoneStatuses] = useState<Record<string, string>>({})



  // Debug function to track state changes

  const handleSetSelectedProjectId = (projectId: string) => {

    setSelectedProjectId(projectId)

  }



  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery()



  // Submission mutation

  const [submitMilestone, { isLoading: isSubmitting }] = useSubmitMilestoneMutation()



  // AQAs mutation

  const [runAQAs, { isLoading: isRunningAQAs }] = useRunAQAsMutation()



  // Load submission ID from localStorage on component mount and when milestone changes

  useEffect(() => {

    if (selectedMilestone) {

      const storageKey = `submissionId_${selectedMilestone.milestone_id}`

      const storedSubmissionId = localStorage.getItem(storageKey)

      if (storedSubmissionId) {

        setMilestoneSubmissions(prev => ({

          ...prev,

          [selectedMilestone.milestone_id]: { submission_id: storedSubmissionId }

        }))

      }

    }

  }, [selectedMilestone])



  // Submission handlers

  const handleOpenSubmissionModal = (milestone: any) => {

    setSelectedMilestone(milestone)

    setSubmissionForm({

      type: 'code',

      repo_url: '',

      content: ''

    })

    setShowSubmissionModal(true)

  }



  const handleCloseSubmissionModal = () => {

    setShowSubmissionModal(false)

    setSelectedMilestone(null)

    setSubmissionForm({

      type: 'code',

      repo_url: '',

      content: ''

    })

  }



  const handleSubmissionChange = (e: any) => {

    const { name, value } = e.target

    setSubmissionForm(prev => ({

      ...prev,

      [name]: value

    }))

  }



  const handleSubmitMilestone = async (e: React.FormEvent) => {

    e.preventDefault()



    if (!selectedProjectId || !selectedMilestone) return



    try {

      const result = await submitMilestone({

        projectId: selectedProjectId,

        milestoneId: selectedMilestone.milestone_id,

        data: submissionForm

      }).unwrap()



      // Save submission ID to localStorage

      const storageKey = `submissionId_${selectedMilestone.milestone_id}`

      if (result && result.submission && result.submission.submission_id) {

        localStorage.setItem(storageKey, result.submission.submission_id)

      } else {

        console.error("submission_id is missing!", result)

      }

      // Track submission

      setMilestoneSubmissions(prev => ({

        ...prev,

        [selectedMilestone.milestone_id]: result.submission

      }))


      // Update milestone status to submitted

      setMilestoneStatuses(prev => ({

        ...prev,

        [selectedMilestone.milestone_id]: 'submitted'

      }))



      handleCloseSubmissionModal()

    } catch (error) {

      console.error('Failed to submit milestone:', error)

    }

  }



  // AQAs handlers

  const handleOpenAQAModal = (milestone: any) => {

    setSelectedMilestone(milestone)

    setShowAQAModal(true)

  }



  const handleCloseAQAModal = () => {

    setShowAQAModal(false)

    setSelectedMilestone(null)

  }



  const handleRunAQAs = async () => {

    if (!selectedMilestone || !milestoneSubmissions[selectedMilestone.milestone_id]) return



    try {

      const result = await runAQAs(milestoneSubmissions[selectedMilestone.milestone_id].submission_id).unwrap()



      // Track the AQA result

      setAqaResults(prev => ({

        ...prev,

        [selectedMilestone.milestone_id]: result

      }))



      handleCloseAQAModal()

    } catch (error) {

      console.error('Failed to run AQAs:', error)

    }

  }



  // Check if milestone has submission

  const hasSubmission = (milestoneId: string) => {

    return !!milestoneSubmissions[milestoneId]

  }



  // Check if milestone has AQA results

  const hasAqaResults = (milestoneId: string) => {

    return !!aqaResults[milestoneId]

  }



  // Fetch all milestones for the selected project directly

  const {

    data: filteredMilestones = [],

    isLoading: milestonesLoading,

    error: milestonesError

  } = useGetProjectMilestonesQuery(

    selectedProjectId,

    { skip: !selectedProjectId }

  )



  // Get a display name for the project (use email or ID)

  const getProjectDisplayName = (project: any) => {

    if (project.employer_email) {

      return project.employer_email

    } else if (project.freelancer_id) {

      return project.freelancer_id

    } else {

      return project.project_id || project.id || 'Unknown Project'

    }

  }



  const selectedProject = projects?.find(p => p.project_id === selectedProjectId)



  const getStatusColor = (status: string) => {

    switch (status.toLowerCase()) {

      case 'completed':

        return 'bg-green-100 text-green-800'

      case 'in_progress':

        return 'bg-blue-100 text-blue-800'

      case 'pending':

        return 'bg-yellow-100 text-yellow-800'

      case 'revision_exhausted':

        return 'bg-red-100 text-red-800'

      default:

        return 'bg-gray-100 text-gray-800'

    }

  }



  const getStatusIcon = (status: string) => {

    switch (status.toLowerCase()) {

      case 'completed':

        return <CheckCircle className="w-4 h-4" />

      case 'in_progress':

        return <RefreshCw className="w-4 h-4" />

      default:

        return <Clock className="w-4 h-4" />

    }

  }



  const formatCurrency = (amount: number) => {

    return new Intl.NumberFormat('en-US', {

      style: 'currency',

      currency: 'USD'

    }).format(amount)

  }



  const formatDate = (dateString: string) => {

    return new Date(dateString).toLocaleDateString('en-US', {

      year: 'numeric',

      month: 'short',

      day: 'numeric'

    })

  }

  const isOverdue = (deadline: string, status: string) => {
    if (status !== 'pending') return false
    const today = new Date()
    const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    return new Date(deadline).getTime() < todayMs
  }

  const isDueSoon = (deadline: string, status: string) => {
    if (status !== 'pending') return false
    const today = new Date()
    const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    const twoDaysMs = todayMs + 2 * 24 * 60 * 60 * 1000
    const deadlineMs = new Date(deadline).getTime()
    return deadlineMs >= todayMs && deadlineMs <= twoDaysMs
  }



  if (projectsLoading) {

    return (

      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AD7D56]"></div>

        <p className="ml-4 text-gray-600">Loading projects...</p>

      </div>

    )

  }



  return (

    <div className="bg-white min-h-screen bg-gray-50 py-8">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.5 }}

        >

          {/* Header */}

          <div className="bg-white mb-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <h1 className="text-2xl font-bold text-gray-900">Milestones</h1>

                <p className="text-sm text-gray-500 mt-1">Track project milestones and deadlines</p>

              </div>



              {/* Project Selector */}

              <div className="relative">

                <button

                  onClick={() => setDropdownOpen(!dropdownOpen)}

                  className="w-full sm:w-64 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"

                >

                  <span className="text-gray-900 truncate">

                    {selectedProject ? (selectedProject.name || selectedProject.project_id) : 'Select a project'}

                  </span>

                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />

                </button>



                {dropdownOpen && (

                  <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">

                    {projects?.length === 0 ? (

                      <div className="px-4 py-3 text-sm text-gray-500">No projects available</div>

                    ) : (

                      projects?.map((project, index) => (

                        <button

                          key={project.project_id || `project-${index}`}

                          onClick={() => {

                            handleSetSelectedProjectId(project.project_id)

                            setDropdownOpen(false)

                          }}

                          className="block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"

                        >

                          <div className="text-sm font-medium text-gray-900">{project.project_id}</div>

                          <div className="text-xs text-gray-500 mt-1">{project.status}</div>

                        </button>

                      ))

                    )}

                  </div>

                )}

              </div>

            </div>

          </div>



          {/* No Project Selected */}

          {!selectedProjectId && (

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">

              <div className="text-center">

                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Project</h3>

                <p className="text-gray-600">Choose a project from the dropdown above to view its milestones</p>

              </div>

            </div>

          )}



          {/* Milestones Loading */}

          {selectedProjectId && milestonesLoading && (

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">

              <div className="text-center">

                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AD7D56] mx-auto mb-4"></div>

                <p className="text-gray-600">Loading milestones...</p>

              </div>

            </div>

          )}



          {/* Milestones Error */}

          {selectedProjectId && milestonesError && (

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">

              <div className="text-center">

                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />

                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Milestones</h3>

                <p className="text-gray-600">Please try refreshing the page</p>

              </div>

            </div>

          )}



          {/* Milestones List */}

          {selectedProjectId && filteredMilestones && filteredMilestones.length > 0 && (

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              <div className="px-6 py-4 border-b border-gray-200">

                <h2 className="text-lg font-semibold text-gray-900">

                  {selectedProject?.name || selectedProject?.project_id} - Milestones

                </h2>

                <p className="text-sm text-gray-500 mt-1">

                  {filteredMilestones.length} milestone{filteredMilestones.length !== 1 ? 's' : ''} found

                </p>

              </div>



              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-gray-200">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Milestone

                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Deadline

                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Amount

                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Status

                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Revisions

                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Actions

                      </th>

                    </tr>

                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">

                    {filteredMilestones.map((milestone: any, index: number) => (

                      <motion.tr

                        key={milestone.milestone_id}

                        initial={{ opacity: 0, x: -20 }}

                        animate={{ opacity: 1, x: 0 }}

                        transition={{ duration: 0.3, delay: index * 0.1 }}

                        className="hover:bg-gray-50 transition-colors"

                      >

                        <td className="px-6 py-4 whitespace-nowrap">

                          <div className="text-sm font-medium text-gray-900">

                            {milestone.title}

                          </div>

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">

                          <div className="flex items-center gap-2">

                            <div className="flex items-center text-sm text-gray-900">

                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />

                              {formatDate(milestone.deadline)}

                            </div>

                            {isOverdue(milestone.deadline, milestoneStatuses[milestone.milestone_id] || milestone.status) && (

                              <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700 uppercase tracking-wide">

                                OVERDUE

                              </span>

                            )}

                            {!isOverdue(milestone.deadline, milestoneStatuses[milestone.milestone_id] || milestone.status) &&

                              isDueSoon(milestone.deadline, milestoneStatuses[milestone.milestone_id] || milestone.status) && (

                              <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-yellow-100 text-yellow-700 uppercase tracking-wide">

                                DUE SOON

                              </span>

                            )}

                          </div>

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">

                          <div className="flex items-center text-sm text-gray-900">

                            <DollarSign className="w-4 h-4 text-gray-400 mr-2" />

                            {formatCurrency(milestone.payment_amount)}

                          </div>

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">

                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(

                            milestoneStatuses[milestone.milestone_id] || milestone.status

                          )}`}>

                            {getStatusIcon(milestoneStatuses[milestone.milestone_id] || milestone.status)}

                            <span className="ml-1">

                              {(milestoneStatuses[milestone.milestone_id] || milestone.status).replace('_', ' ')}

                            </span>

                          </span>

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">

                          <div className="text-sm text-gray-900">

                            <span className="font-medium">{milestone.revisions_used}</span>

                            <span className="text-gray-400">/{milestone.max_revisions}</span>

                          </div>

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">

                          <div className="flex gap-2">

                            <button

                              onClick={() => handleOpenSubmissionModal(milestone)}

                              disabled={(milestoneStatuses[milestone.milestone_id] || milestone.status) === 'revision_exhausted'}

                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#AD7D56] text-white text-xs font-medium rounded hover:bg-[#8B6344] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

                              title={(milestoneStatuses[milestone.milestone_id] || milestone.status) === 'revision_exhausted' ? 'No revisions remaining' : undefined}

                            >

                              <Send className="w-3 h-3" />

                              Submit

                            </button>

                            <button

                              onClick={() => handleOpenAQAModal(milestone)}

                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${hasSubmission(milestone.milestone_id)

                                ? 'bg-blue-600 text-white hover:bg-blue-700'

                                : 'bg-blue-500 text-white hover:bg-blue-600'

                                }`}

                            >

                              <Play className="w-3 h-3" />

                              Run AQAs

                            </button>

                          </div>

                        </td>

                      </motion.tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}



          {/* No Milestones */}

          {selectedProjectId && filteredMilestones && filteredMilestones.length === 0 && (

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">

              <div className="text-center">

                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />

                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Milestones Found</h3>

                <p className="text-gray-600">This project doesn't have any milestones yet</p>

              </div>

            </div>

          )}

        </motion.div>

      </div>



      {/* Submission Modal */}

      {showSubmissionModal && selectedMilestone && (

        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseSubmissionModal} />

          <motion.div

            initial={{ opacity: 0, scale: 0.95, y: 20 }}

            animate={{ opacity: 1, scale: 1, y: 0 }}

            exit={{ opacity: 0, scale: 0.95, y: 20 }}

            className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl"

          >

            <div className="flex items-center justify-between p-6 border-b">

              <h2 className="text-xl font-semibold">Submit Milestone</h2>

              <button onClick={handleCloseSubmissionModal}>

                <AlertCircle className="w-5 h-5 text-gray-400" />

              </button>

            </div>



            <form onSubmit={handleSubmitMilestone} className="p-6 space-y-5">

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Milestone

                </label>

                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">

                  <p className="text-sm font-medium text-gray-900">{selectedMilestone.title}</p>

                </div>

              </div>



              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Submission Type

                </label>

                <select

                  name="type"

                  value={submissionForm.type}

                  onChange={handleSubmissionChange}

                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent outline-none"

                >

                  <option value="code">Code</option>

                  <option value="design">Design</option>

                  <option value="documentation">Documentation</option>

                  <option value="other">Other</option>

                </select>

              </div>



              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Repository URL

                </label>

                <div className="relative">

                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                  <input

                    type="url"

                    name="repo_url"

                    value={submissionForm.repo_url}

                    onChange={handleSubmissionChange}

                    placeholder="https://github.com/username/repo"

                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent outline-none"

                  />

                </div>

              </div>



              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Description

                </label>

                <textarea

                  name="content"

                  value={submissionForm.content}

                  onChange={handleSubmissionChange}

                  placeholder="Describe your submission..."

                  rows={4}

                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent outline-none resize-none"

                />

              </div>



              <div className="flex gap-3 pt-4">

                <button

                  type="button"

                  onClick={handleCloseSubmissionModal}

                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={isSubmitting}

                  className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition disabled:opacity-50"

                >

                  {isSubmitting ? "Submitting..." : "Submit Milestone"}

                </button>

              </div>

            </form>

          </motion.div>

        </div>

      )}



      {/* AQAs Modal */}

      {showAQAModal && selectedMilestone && (

        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseAQAModal} />

          <motion.div

            initial={{ opacity: 0, scale: 0.95, y: 20 }}

            animate={{ opacity: 1, scale: 1, y: 0 }}

            exit={{ opacity: 0, scale: 0.95, y: 20 }}

            className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl"

          >

            <div className="flex items-center justify-between p-6 border-b">

              <h2 className="text-xl font-semibold">Run Automated Quality Assurance</h2>

              <button onClick={handleCloseAQAModal}>

                <AlertCircle className="w-5 h-5 text-gray-400" />

              </button>

            </div>



            <div className="p-6 space-y-5">

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Milestone

                </label>

                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">

                  <p className="text-sm font-medium text-gray-900">{selectedMilestone.title}</p>

                </div>

              </div>



              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Submission Status

                </label>

                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">

                  <p className="text-sm text-gray-900">

                    {hasSubmission(selectedMilestone.milestone_id) ? (

                      <span className="flex items-center gap-2">

                        <CheckCircle className="w-4 h-4 text-green-500" />

                        Submitted on {new Date(milestoneSubmissions[selectedMilestone.milestone_id].created_at).toLocaleDateString()}

                      </span>

                    ) : (

                      <span className="flex items-center gap-2 text-gray-400">

                        <AlertCircle className="w-4 h-4" />

                        No submission found

                      </span>

                    )}

                  </p>

                </div>

              </div>



              {hasAqaResults(selectedMilestone.milestone_id) && (

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">

                    Previous AQA Results

                  </label>

                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">

                    <div className="space-y-2">

                      <div className="flex items-center justify-between">

                        <span className="text-sm text-gray-900">Verdict:</span>

                        <span className={`text-sm font-medium ${aqaResults[selectedMilestone.milestone_id].verdict === 'passed'

                          ? 'text-green-600'

                          : 'text-red-600'

                          }`}>

                          {aqaResults[selectedMilestone.milestone_id].verdict}

                        </span>

                      </div>

                      <div className="flex items-center justify-between">

                        <span className="text-sm text-gray-900">Pass Rate:</span>

                        <span className="text-sm text-gray-900">{aqaResults[selectedMilestone.milestone_id].pass_rate}%</span>

                      </div>

                      <div className="flex items-center justify-between">

                        <span className="text-sm text-gray-900">Payment Status:</span>

                        <span className="text-sm text-gray-900">{aqaResults[selectedMilestone.milestone_id].payment_status}</span>

                      </div>

                    </div>

                  </div>

                </div>

              )}



              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

                <div className="flex items-start gap-3">

                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />

                  <div>

                    <h4 className="text-sm font-medium text-blue-900">About AQAs</h4>

                    <p className="text-sm text-blue-700 mt-1">

                      Automated Quality Assurance checks your submission against predefined criteria.

                      This process may take a few minutes to complete.

                    </p>

                  </div>

                </div>

              </div>



              <div className="flex gap-3 pt-4">

                <button

                  type="button"

                  onClick={handleCloseAQAModal}

                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"

                >

                  Cancel

                </button>

                <button

                  onClick={handleRunAQAs}

                  disabled={isRunningAQAs}

                  className={`flex-1 px-4 py-2 rounded-lg transition ${!isRunningAQAs

                    ? 'bg-blue-600 text-white hover:bg-blue-700'

                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'

                    }`}

                >

                  {isRunningAQAs ? "Running AQAs..." : "Run AQAs"}

                </button>

              </div>

            </div>

          </motion.div>

        </div>

      )}

    </div>

  )

}

