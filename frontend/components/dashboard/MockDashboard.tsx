'use client'

import { projects } from '../../data/mockProjects'
import { milestones } from '../../data/mockMilestones'
import { escrowData } from '../../data/mockEscrow'
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'

export default function MockDashboard() {
  // Calculate statistics
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'Active').length
  const totalEscrow = escrowData.totalEscrow
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length

  const statsData = [
    {
      title: 'Total Projects',
      value: totalProjects.toString(),
      change: '+12%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      title: 'Active Projects',
      value: activeProjects.toString(),
      change: '+8%',
      trend: 'up',
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: 'Total Escrow',
      value: totalEscrow,
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-[#AD7D56]'
    },
    {
      title: 'Completed Milestones',
      value: completedMilestones.toString(),
      change: '+15%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111111] mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Projects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#111111]">Active Projects</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Project</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Client</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Freelancer</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Escrow</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Progress</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-[#111111]">{project.name}</p>
                      <p className="text-sm text-gray-500">ID: {project.id}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{project.client}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{project.freelancer}</td>
                  <td className="py-4 px-6 text-sm font-medium text-[#111111]">{project.escrow}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'Completed' 
                        ? 'bg-green-100 text-green-700'
                        : project.status === 'Active'
                        ? 'bg-blue-100 text-blue-700'
                        : project.status === 'In Review'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#AD7D56] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{project.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#111111]">Milestone Progress</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-[#111111] text-sm">{milestone.title}</h3>
                  <p className="text-xs text-gray-500">{milestone.projectName}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  milestone.status === 'Completed' 
                    ? 'bg-green-100 text-green-700'
                    : milestone.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {milestone.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-[#111111]">{milestone.progress}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#AD7D56] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Due: {milestone.dueDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
