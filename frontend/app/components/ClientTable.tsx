'use client'

import { motion } from 'framer-motion'
import { Mail, TrendingUp, Star, MoreVertical, Eye } from 'lucide-react'

interface Client {
  user_id: string
  email: string
  role?: string
  pfi_score: number
  trust_score: number
  created_at: string
}

interface ClientTableProps {
  clients: Client[]
}

export default function ClientTable({ clients }: ClientTableProps) {
  // Get trust score badge color
  const getTrustScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'High'
      }
    } else if (score >= 50) {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Medium'
      }
    } else {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Low'
      }
    }
  }

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">All Clients</h2>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PFI Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trust Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client, index) => (
              <motion.tr
                key={client.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {/* Email */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#AD7D56] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {client.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.email}</div>
                      <div className="text-sm text-gray-500">ID: {client.user_id}</div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {client.role || 'Client'}
                  </span>
                </td>

                {/* PFI Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">{client.pfi_score}</span>
                  </div>
                </td>

                {/* Trust Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900">{client.trust_score}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTrustScoreBadge(client.trust_score).bg} ${getTrustScoreBadge(client.trust_score).text}`}>
                      {getTrustScoreBadge(client.trust_score).label}
                    </span>
                  </div>
                </td>

                {/* Created At */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(client.created_at)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
