'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, User, Menu, LogOut, ChevronDown } from 'lucide-react'
import { authService } from '../services/authService'

interface HeaderProps {
  isMobile: boolean
  toggleSidebar: () => void
  sidebarCollapsed: boolean
}

export default function Header({ isMobile, toggleSidebar, sidebarCollapsed }: HeaderProps) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const handleLogout = () => {
    authService.logout()
    window.location.href = '/login'
  }
  return (
    <motion.header 
      className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-200"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <motion.button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </motion.button>
        )}
        
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="min-w-0"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-[#111111] truncate">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Welcome back to your AI Escrow dashboard</p>
        </motion.div>
      </div>
      
      {/* Right Section */}
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
        <div className="relative">
          <motion.button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
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
            >
              <User className="w-6 h-6 text-[#111111]" />
            </motion.div>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isProfileDropdownOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileDropdownOpen(false)}
                />
                
                {/* Dropdown Menu */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="py-2">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-[#111111]">John Doe</p>
                      <p className="text-xs text-gray-600">john.doe@example.com</p>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      <motion.button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        whileHover={{ backgroundColor: '#F9FAFB' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LogOut className="w-4 h-4 text-gray-500" />
                        Sign Out
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.header>
  )
}
