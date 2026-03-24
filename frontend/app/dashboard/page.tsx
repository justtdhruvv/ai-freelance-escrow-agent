'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Bell, TrendingUp, Briefcase, DollarSign, Target, CheckCircle, User, MoreVertical, Eye, Plus } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { useGetProjectsQuery } from '../store/api/projectsApi'
import { setProjects } from '../store/slices/projectSlice'
import { useCreateProjectMutation } from '../store/api/projectsApi'
import { useGetClientsQuery } from '../store/api/clientsApi'
import { useRouter } from 'next/dist/client/components/navigation'

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>()
    const router = useRouter()
  const { user } = useSelector((state: RootState) => state.auth)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    total_price: 0,
    timeline_days: 0,
    client_id: ''
  })

  // Fetch projects using RTK Query
  const { data: projectsData, isLoading, error } = useGetProjectsQuery()
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation()
  const { data: clientsData } = useGetClientsQuery()
  const clients = clientsData?.clients || []

  useEffect(() => {
    if (projectsData) {
      dispatch(setProjects(projectsData))
    }
  }, [projectsData, dispatch])

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {}

    clients.forEach((c: any) => {
      map[c.user_id] = c.email
    })

    return map
  }, [clients])

  // Dummy stats data based on new structure
  const stats = [
    {
      title: 'Total Projects',
      value: projectsData?.length || '0',
      growth: '+12%',
      icon: Briefcase,
      color: 'text-blue-600'
    },
    {
      title: 'Active Projects',
      value: projectsData?.filter(p => p.status === 'active').length || '0',
      growth: '+5%',
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: 'Total Escrow',
      value: `$${projectsData?.reduce((sum, p) => sum + p.total_price, 0).toLocaleString() || '0'}`,
      growth: '+18%',
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      title: 'Completed Briefs',
      value: projectsData?.filter(p => p.brief).length || '0',
      growth: '+24%',
      icon: CheckCircle,
      color: 'text-orange-600'
    }
  ]

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      'active': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Active' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      'disputed': { bg: 'bg-red-100', text: 'text-red-800', label: 'Disputed' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const handleRedirectProjects = () => {
    router.push('/dashboard/projects')
  }

  const handleCreateProject = async () => {
    try {
      await createProject(createFormData).unwrap()
      setShowCreateModal(false)
      setCreateFormData({ total_price: 0, timeline_days: 0, client_id: '' })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }



  return (
    <div className=" bg-white p-6 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back to your AI Escrow dashboard, {user?.name || 'User'}!</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="flex items-center space-x-2 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-gray-50 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">{stat.growth}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Projects Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <button onClick={handleRedirectProjects} className="text-[#AD7D56] hover:text-[#8B6344] text-sm font-medium transition-colors">
              View All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brief
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectsData?.slice(0, 5).map((project) => (
                <tr key={project.project_id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">Created: {new Date(project.created_at || '').toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clientMap[project.employer_id]
                      ? clientMap[project.employer_id]
                      : clients.length === 0
                        ? 'Loading...'
                        : 'Unknown Client'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${project.total_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.timeline_days} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.brief ? (
                      <span className="text-green-600">✓ Added</span>
                    ) : (
                      <span className="text-gray-400">Not added</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!projectsData || projectsData.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600">
              Get started by creating your first escrow project
            </p>
          </div>
        )}
      </motion.div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Price ($)</label>
                <input
                  type="number"
                  value={createFormData.total_price}
                  onChange={(e) => setCreateFormData({ ...createFormData, total_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline (days)</label>
                <input
                  type="number"
                  value={createFormData.timeline_days}
                  onChange={(e) => setCreateFormData({ ...createFormData, timeline_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID (optional)</label>
                <input
                  type="text"
                  value={createFormData.client_id}
                  onChange={(e) => setCreateFormData({ ...createFormData, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56]"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={isCreating}
                className="px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
