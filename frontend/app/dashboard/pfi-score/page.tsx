'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Star,
  Shield
} from 'lucide-react'
import { useGetUserProfileQuery } from '../../store/api/projectsApi'

export default function PFIScorePage() {
  const [pfiData, setPfiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use Redux API to get user profile (which includes PFI score)
  const { data: profileData, isLoading, isError, refetch } = useGetUserProfileQuery()

  const loadPFIData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate PFI data structure from profile
      if (profileData) {
        const mockPfiData = {
          pfi_score: profileData.pfi_score || 500,
          trust_score: profileData.trust_score || 500,
          pfi_history: [], // Would come from backend in real implementation
          recent_activity: [] // Would come from backend in real implementation
        }
        setPfiData(mockPfiData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PFI data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profileData) {
      loadPFIData()
    }
  }, [profileData])

  // Helper functions that were in walletService
  const getPFITrend = (history: any[] = []) => {
    if (history.length === 0) {
      return { trend: 'stable', change: 0, recentActivity: [] }
    }
    
    const latest = history[history.length - 1]
    const previous = history.length > 1 ? history[history.length - 2] : latest
    const change = latest.score - previous.score
    
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change,
      recentActivity: history.slice(-5).map((item: any) => ({
        description: item.reason || 'Score updated',
        score_change: item.score - (previous?.score || item.score),
        timestamp: item.timestamp
      }))
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Loading PFI score data...</p>
      </div>
    )
  }

  if (isError || error || !profileData || !pfiData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error || 'Failed to load PFI score data'}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-2 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  const pfiTrend = getPFITrend(pfiData.pfi_history || [])
  const scoreLevel = pfiData.pfi_score >= 800 ? 'Excellent' : 
                    pfiData.pfi_score >= 600 ? 'Good' : 
                    pfiData.pfi_score >= 400 ? 'Average' : 'Needs Improvement'

  const scoreColor = pfiData.pfi_score >= 800 ? 'text-green-600' : 
                   pfiData.pfi_score >= 600 ? 'text-blue-600' : 
                   pfiData.pfi_score >= 400 ? 'text-yellow-600' : 'text-red-600'

  const bgColor = pfiData.pfi_score >= 800 ? 'bg-green-100' : 
                 pfiData.pfi_score >= 600 ? 'bg-blue-100' : 
                 pfiData.pfi_score >= 400 ? 'bg-yellow-100' : 'bg-red-100'

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Professional Fidelity Index</h1>
        <p className="text-gray-600 mt-1">Track your reputation and trust score</p>
      </motion.div>

      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-8 mb-8"
      >
        <div className="text-center">
          <div className={`w-24 h-24 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Shield className="w-12 h-12 text-gray-700" />
          </div>
          
          <h2 className="text-5xl font-bold text-gray-900 mb-2">{pfiData.pfi_score}</h2>
          <p className={`text-xl font-medium ${scoreColor} mb-4`}>{scoreLevel}</p>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            {pfiTrend.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
            {pfiTrend.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
            {pfiTrend.trend === 'stable' && <Target className="w-5 h-5 text-gray-600" />}
            <span className="text-gray-600">
              {pfiTrend.trend === 'up' ? 'Improving' : 
               pfiTrend.trend === 'down' ? 'Declining' : 'Stable'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-[#AD7D56] to-[#8B6344] h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((pfiData.pfi_score / 1000) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">PFI Score</span>
              <span className="font-semibold text-gray-900">{pfiData.pfi_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Trust Score</span>
              <span className="font-semibold text-gray-900">{pfiData.trust_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recent Change</span>
              <span className={`font-semibold ${
                pfiTrend.change > 0 ? 'text-green-600' : 
                pfiTrend.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {pfiTrend.change > 0 ? '+' : ''}{pfiTrend.change}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
          </div>
          
          <div className="space-y-3">
            {pfiData.pfi_score >= 800 && (
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-700">Top Performer</span>
              </div>
            )}
            {pfiData.pfi_score >= 600 && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Reliable Freelancer</span>
              </div>
            )}
            {pfiData.pfi_score >= 400 && (
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Consistent Quality</span>
              </div>
            )}
            {pfiData.pfi_score < 400 && (
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-gray-700">Room for Growth</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {(!pfiData.pfi_history || pfiData.pfi_history.length === 0) ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pfiTrend.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.score_change > 0 ? 'bg-green-100' : 
                    activity.score_change < 0 ? 'bg-red-100' : 
                    'bg-gray-100'
                  }`}>
                    {activity.score_change > 0 && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {activity.score_change < 0 && <TrendingDown className="w-5 h-5 text-red-600" />}
                    {activity.score_change === 0 && <Target className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    activity.score_change > 0 ? 'text-green-600' : 
                    activity.score_change < 0 ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {activity.score_change > 0 ? '+' : ''}{activity.score_change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tips for Improvement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-[#AD7D56] to-[#8B6344] rounded-xl shadow-sm p-6 text-white mt-6"
      >
        <h3 className="text-xl font-semibold mb-4">Tips to Improve Your PFI Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium">Complete Milestones on Time</p>
              <p className="text-sm opacity-90">Deliver quality work within deadlines</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium">Maintain High Quality</p>
              <p className="text-sm opacity-90">Pass AQA checks consistently</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium">Communicate Effectively</p>
              <p className="text-sm opacity-90">Keep clients updated on progress</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium">Handle Disputes Professionally</p>
              <p className="text-sm opacity-90">Resolve conflicts amicably</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
