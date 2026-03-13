'use client'

import { motion } from 'framer-motion'
import { Search, Bell, User, Menu, X } from 'lucide-react'

interface HeaderProps {
  sidebarOpen: boolean
  toggleSidebar: () => void
  isMobile: boolean
}

export default function Header({ sidebarOpen, toggleSidebar, isMobile }: HeaderProps) {
  return (
    <motion.header 
      className="bg-white border-b border-gray-200 px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Toggle Button */}
          <motion.button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 hover:text-[#111111] hover:bg-gray-100 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-[#111111]">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back to your AI Escrow dashboard</p>
          </motion.div>
        </div>
        
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {/* Search Bar - Hidden on mobile */}
          {!isMobile && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <motion.input
                type="text"
                placeholder="Search projects..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent w-64"
                whileFocus={{ scale: 1.02, borderColor: '#AD7D56' }}
                transition={{ duration: 0.2 }}
              />
            </div>
          )}
          
          {/* Notification Button */}
          <motion.button 
            className="relative p-2 text-gray-600 hover:text-[#111111] transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-6 h-6" />
            <motion.span 
              className="absolute top-1 right-1 w-2 h-2 bg-[#AD7D56] rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
          
          {/* User Profile */}
          <div className="flex items-center gap-3">
            {/* User Info - Hidden on mobile */}
            {!isMobile && (
              <div className="text-right">
                <p className="text-sm font-medium text-[#111111]">John Doe</p>
                <p className="text-xs text-gray-600">Premium Account</p>
              </div>
            )}
            <motion.div 
              className="w-10 h-10 bg-[#CDB49E] rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-6 h-6 text-[#111111]" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  )
}
