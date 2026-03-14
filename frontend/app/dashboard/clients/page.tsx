'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Filter, Pencil, Trash2 } from 'lucide-react'
import { clientService, Client } from '../../services/clientService'
import CreateClientModal from '../../components/CreateClientModal'
import EditClientModal from '../../components/EditClientModal'
import DeleteClientModal from '../../components/DeleteClientModal'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await clientService.getClients()
      setClients(data)
    } catch (err) {
      setError('Failed to load clients')
      console.error('Fetch clients error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setShowEditModal(true)
  }

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client)
    setShowDeleteModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[#111111]">Clients</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Manage all your client information
            </p>
          </div>

          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors w-full md:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Create New Client
          </motion.button>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div 
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div 
          className="flex justify-center items-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AD7D56]"></div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div 
          className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredClients.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-gray-500">
            <p className="text-lg font-medium mb-2">No clients found</p>
            <p className="text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first client to get started'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Clients Table */}
      {!loading && !error && filteredClients.length > 0 && (
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.email}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateClientModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={fetchClients}
        />
      )}

      {showEditModal && selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchClients}
        />
      )}

      {showDeleteModal && selectedClient && (
        <DeleteClientModal
          client={selectedClient}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={fetchClients}
        />
      )}
    </div>
  )
}
