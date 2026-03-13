'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024
      
      setIsMobile(mobile)
      
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setSidebarCollapsed(true)
        setSidebarOpen(false)
      } else if (tablet) {
        setSidebarCollapsed(true)
        setSidebarOpen(false)
      } else {
        setSidebarCollapsed(false)
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#F5F1EC] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `relative transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'w-16' : 'w-64'
              }`
          }
        `}
      >
        <Sidebar 
          collapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
          onClose={closeSidebar}
        />
      </motion.div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 bg-[#F5F1EC] min-w-0">
        {/* Header */}
        <Header 
          isMobile={isMobile} 
          toggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
