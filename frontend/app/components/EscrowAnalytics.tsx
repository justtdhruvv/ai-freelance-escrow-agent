'use client'

import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'

const analytics = {
  totalEscrow: {
    value: '$125,430',
    change: '+12.5%',
    trend: 'up',
    description: 'Total escrow funds held'
  },
  monthlyReleases: {
    value: '$45,230',
    change: '+8.2%',
    trend: 'up',
    description: 'Released this month'
  },
  pendingApprovals: {
    value: '$18,920',
    change: '-3.1%',
    trend: 'down',
    description: 'Awaiting approval'
  },
  avgReleaseTime: {
    value: '2.4 days',
    change: '-15%',
    trend: 'down',
    description: 'Average release time'
  }
}

const recentTransactions = [
  {
    id: 'TXN001',
    project: 'E-commerce Website',
    amount: '$2,500',
    type: 'release',
    status: 'completed',
    timestamp: '2 hours ago'
  },
  {
    id: 'TXN002',
    project: 'Mobile App Design',
    amount: '$1,800',
    type: 'deposit',
    status: 'pending',
    timestamp: '4 hours ago'
  },
  {
    id: 'TXN003',
    project: 'Data Analytics Dashboard',
    amount: '$3,200',
    type: 'release',
    status: 'completed',
    timestamp: '6 hours ago'
  },
  {
    id: 'TXN004',
    project: 'API Integration',
    amount: '$950',
    type: 'deposit',
    status: 'completed',
    timestamp: '1 day ago'
  }
]

export default function EscrowAnalytics() {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(analytics).map(([key, data]) => (
          <div key={key} className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#AD7D56]15 flex items-center justify-center">
                {key === 'totalEscrow' && <Wallet className="w-5 h-5 text-[#AD7D56]" />}
                {key === 'monthlyReleases' && <TrendingUp className="w-5 h-5 text-green-600" />}
                {key === 'pendingApprovals' && <DollarSign className="w-5 h-5 text-yellow-600" />}
                {key === 'avgReleaseTime' && <TrendingDown className="w-5 h-5 text-blue-600" />}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                data.trend === 'up' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {data.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {data.change}
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-[#111111] mb-1">{data.value}</p>
              <p className="text-xs text-gray-600">{data.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#111111] mb-2">Recent Transactions</h2>
          <p className="text-sm text-gray-600">Latest escrow deposits and releases</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {recentTransactions.map((transaction, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'release' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {transaction.type === 'release' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#111111]">{transaction.project}</p>
                    <p className="text-sm text-gray-600">{transaction.id} • {transaction.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#111111]">{transaction.amount}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    transaction.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-100">
          <button className="w-full text-center text-sm text-[#AD7D56] hover:text-[#111111] font-medium transition-colors">
            View All Transactions
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#AD7D56] to-[#CDB49E] rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Completion Rate</h3>
          <div className="text-3xl font-bold mb-2">94.2%</div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div className="bg-white h-2 rounded-full" style={{ width: '94.2%' }}></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Milestones</h3>
          <div className="text-3xl font-bold mb-2">18</div>
          <p className="text-sm opacity-90">Across 8 projects</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
          <div className="text-3xl font-bold mb-2">98.5%</div>
          <p className="text-sm opacity-90">AI verified</p>
        </div>
      </div>
    </div>
  )
}
