'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Search, Mail, TrendingUp, Shield, Star, MoreVertical, Eye } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { useGetClientsQuery } from '../../store/api/clientsApi'
import { useCreateClientMutation } from '../../store/api/clientsApi'
import ClientTable from '../../components/ClientTable'
import CreateClientModal from '../../components/CreateClientModal'
import { ApiDebugger } from '../../utils/apiDebugger'

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch clients using RTK Query
  const { data, isLoading, error, refetch } = useGetClientsQuery()
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation()

  // Extract clients from response format: { clients: [...], count: number }
  const clients = data?.clients || []

  const handleCreateClient = async (email: string) => {
    try {
      await createClient({ email }).unwrap()
      setShowCreateModal(false)
      // Refetch clients list after adding
      refetch()
    } catch (error) {
      console.error('Failed to create client:', error)
      throw error
    }
  }

  // Debug function to test API
  const runApiDiagnostics = async () => {
    await ApiDebugger.runFullDiagnostics()
  }

  // Filter clients by email
  const filteredClients = clients.filter(client =>
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load clients data</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen bg-[#F5F1EC] p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div >
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Manage your clients and their trust scores</p>
        </div>
      </motion.div>

      {/* Top Section: Search and Add Client */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 flex flex-col sm:flex-row gap-4"
      >
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search clients by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* <button
            onClick={runApiDiagnostics}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Debug API</span>
          </button> */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Client</span>
          </button>
        </div>
      </motion.div>

      {/* Clients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ClientTable clients={filteredClients} />
      </motion.div>

      {/* Empty State */}
      {filteredClients.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
          </p>
        </motion.div>
      )}

      {/* Create Client Modal */}
      {showCreateModal && (
        <CreateClientModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateClient}
          isLoading={isCreating}
        />
      )}
    </div>
  )
}
