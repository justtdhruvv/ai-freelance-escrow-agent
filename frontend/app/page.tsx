'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import StatsCards from './components/StatsCards'
import ProjectsTable from './components/ProjectsTable'
import MilestoneProgress from './components/MilestoneProgress'
import EscrowAnalytics from './components/EscrowAnalytics'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-close sidebar on mobile
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F1EC]">
      <div className="flex relative">
        {/* Sidebar - Fixed Position */}
        <Sidebar isOpen={sidebarOpen} isMobile={isMobile} />
        
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ease-in-out ${
          isMobile ? 'ml-0' : (sidebarOpen ? 'ml-64' : 'ml-16')
        }`}>
          {/* Header */}
          <Header 
            sidebarOpen={sidebarOpen} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isMobile={isMobile}
          />
          
          {/* Dashboard Content */}
          <motion.main 
            className="p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Statistics Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <StatsCards />
            </motion.div>
            
            {/* Main Grid Layout */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Projects Table - Takes 2 columns */}
              <div className="lg:col-span-2">
                <ProjectsTable />
              </div>
              
              {/* Milestone Progress - Takes 1 column */}
              <div>
                <MilestoneProgress />
              </div>
            </motion.div>
            
            {/* Escrow Analytics Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <EscrowAnalytics />
            </motion.div>
          </motion.main>
        </div>
      </div>
    </div>
  )
}