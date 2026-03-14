'use client'

import StatsCards from '../components/StatsCards'
// import ProjectsTable from '../components/ProjectsTable'
import MilestoneProgress from '../components/MilestoneProgress'
import EscrowAnalytics from '../components/EscrowAnalytics'
import ProjectTable from '../components/ProjectTable'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <StatsCards />
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Projects Table - Takes 2 columns on desktop, 1 on laptop */}
        <div className="lg:col-span-1 xl:col-span-2">
          <div className="overflow-x-auto">
            <ProjectTable />
          </div>
        </div>
        
        {/* Milestone Progress - Takes 1 column */}
        <div>
          <MilestoneProgress />
        </div>
      </div>
      
      {/* Escrow Analytics Section */}
      <div className="overflow-x-auto">
        <EscrowAnalytics />
      </div>
    </div>
  )
}
