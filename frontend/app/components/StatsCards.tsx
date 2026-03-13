'use client'

import { motion } from 'framer-motion'
import { FolderOpen, DollarSign, Target, TrendingUp } from 'lucide-react'

const stats = [
  {
    title: 'Total Projects',
    value: '24',
    change: '+12%',
    icon: FolderOpen,
    color: '#AD7D56'
  },
  {
    title: 'Active Escrow Value',
    value: '$45,250',
    change: '+8%',
    icon: DollarSign,
    color: '#10B981'
  },
  {
    title: 'Completed Milestones',
    value: '89',
    change: '+23%',
    icon: Target,
    color: '#3B82F6'
  },
  {
    title: 'AI Trust Score',
    value: '98.5%',
    change: '+2%',
    icon: TrendingUp,
    color: '#8B5CF6'
  }
]

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ 
            y: -5, 
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            scale: 1.02
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
              <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
            </div>
            <motion.span 
              className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              {stat.change}
            </motion.span>
          </div>
          <div>
            <motion.p 
              className="text-2xl font-bold text-[#111111] mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            >
              {stat.value}
            </motion.p>
            <p className="text-sm text-gray-600">{stat.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
