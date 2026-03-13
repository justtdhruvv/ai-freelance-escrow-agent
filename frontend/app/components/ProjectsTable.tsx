'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Eye } from 'lucide-react'

const projects = [
  {
    name: 'E-commerce Website',
    client: 'TechCorp Inc.',
    freelancer: 'Sarah Chen',
    amount: '$8,500',
    status: 'active',
    progress: 75
  },
  {
    name: 'Mobile App Design',
    client: 'StartupHub',
    freelancer: 'Mike Johnson',
    amount: '$6,200',
    status: 'active',
    progress: 60
  },
  {
    name: 'Data Analytics Dashboard',
    client: 'FinanceFlow',
    freelancer: 'Emily Davis',
    amount: '$12,000',
    status: 'review',
    progress: 90
  },
  {
    name: 'API Integration',
    client: 'CloudTech',
    freelancer: 'Alex Rivera',
    amount: '$4,800',
    status: 'completed',
    progress: 100
  },
  {
    name: 'UI/UX Redesign',
    client: 'DesignStudio',
    freelancer: 'Lisa Wang',
    amount: '$7,300',
    status: 'active',
    progress: 45
  }
]

const statusColors = {
  active: 'bg-blue-100 text-blue-800',
  review: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800'
}

export default function ProjectsTable() {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 border-b border-gray-100">
        <motion.h2 
          className="text-lg font-semibold text-[#111111]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          Active Projects
        </motion.h2>
        <p className="text-sm text-gray-600">Manage and monitor your ongoing projects</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Freelancer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Escrow Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {projects.map((project, index) => (
              <motion.tr 
                key={index}
                className="hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{project.name}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <motion.div 
                        className="bg-[#AD7D56] h-1.5 rounded-full" 
                        style={{ width: `${project.progress}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{project.client}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{project.freelancer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111111]">{project.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <motion.span 
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status as keyof typeof statusColors]}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </motion.span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <motion.button 
                    className="text-[#AD7D56] hover:text-[#111111] flex items-center gap-1 transition-colors"
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-100">
        <motion.button 
          className="w-full text-center text-sm text-[#AD7D56] hover:text-[#111111] font-medium flex items-center justify-center gap-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          View All Projects
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}
