'use client'

import { Target, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const milestones = [
  {
    name: 'Project Setup & Planning',
    project: 'E-commerce Website',
    progress: 100,
    status: 'completed',
    dueDate: '2024-01-15'
  },
  {
    name: 'Frontend Development',
    project: 'Mobile App Design',
    progress: 85,
    status: 'in-progress',
    dueDate: '2024-01-20'
  },
  {
    name: 'Backend Integration',
    project: 'Data Analytics Dashboard',
    progress: 60,
    status: 'in-progress',
    dueDate: '2024-01-25'
  },
  {
    name: 'Testing & QA',
    project: 'API Integration',
    progress: 30,
    status: 'pending',
    dueDate: '2024-01-30'
  },
  {
    name: 'Deployment & Launch',
    project: 'UI/UX Redesign',
    progress: 95,
    status: 'review',
    dueDate: '2024-01-18'
  }
]

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  'in-progress': { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  pending: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  review: { icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-100' }
}

export default function MilestoneProgress() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#111111] mb-2">Milestone Progress</h2>
        <p className="text-sm text-gray-600">Track active project milestones and deadlines</p>
      </div>
      
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const status = milestone.status as keyof typeof statusConfig
          const StatusIcon = statusConfig[status].icon
          
          return (
            <div key={index} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-[#111111] mb-1">{milestone.name}</h3>
                  <p className="text-sm text-gray-600">{milestone.project}</p>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${statusConfig[status].bg}`}>
                  <StatusIcon className={`w-4 h-4 ${statusConfig[status].color}`} />
                  <span className={`text-xs font-medium ${statusConfig[status].color}`}>
                    {milestone.status.replace('-', ' ').charAt(0).toUpperCase() + milestone.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-[#111111]">{milestone.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#AD7D56] to-[#CDB49E] h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${milestone.progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Due: {milestone.dueDate}</span>
                  <span className="text-gray-500">
                    {milestone.progress === 100 ? 'Completed' : `${100 - milestone.progress}% remaining`}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full text-center text-sm text-[#AD7D56] hover:text-[#111111] font-medium transition-colors">
          View All Milestones
        </button>
      </div>
    </div>
  )
}
