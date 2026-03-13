'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import StatsCards from '../components/StatsCards'
import ProjectsTable from '../components/ProjectsTable'
import MilestoneProgress from '../components/MilestoneProgress'
import EscrowAnalytics from '../components/EscrowAnalytics'

export default function DashboardPage() {
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex flex-col bg-[#F5F1EC] min-h-screen">
      {/* Header */}
      <Header isMobile={isMobile} />
      
      {/* Dashboard Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <StatsCards />
          
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projects Table - Takes 2 columns */}
            <div className="lg:col-span-2">
              <ProjectsTable />
            </div>
            
            {/* Milestone Progress - Takes 1 column */}
            <div>
              <MilestoneProgress />
            </div>
          </div>
          
          {/* Escrow Analytics Section */}
          <EscrowAnalytics />
        </div>
      </main>
    </div>
  )
}
