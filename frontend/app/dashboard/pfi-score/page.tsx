'use client'

import { motion } from 'framer-motion'
import {
  Award,
  Target,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Star,
  Shield,
  Info
} from 'lucide-react'
import { useGetUserProfileQuery } from '../../store/api/projectsApi'
import { useRouteProtection } from '../../hooks/useRouteProtection'

export default function PFIScorePage() {
  useRouteProtection()
  const { data: profileData, isLoading, isError, refetch } = useGetUserProfileQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Loading PFI score data...</p>
      </div>
    )
  }

  if (isError || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">Failed to load PFI score data</p>
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

  const pfiScore = profileData.pfi_score ?? 500
  const trustScore = profileData.trust_score ?? 500

  const scoreLevel = pfiScore >= 800 ? 'Excellent' :
                     pfiScore >= 600 ? 'Good' :
                     pfiScore >= 400 ? 'Average' : 'Needs Improvement'

  const scoreColor = pfiScore >= 601 ? 'text-green-600' :
                     pfiScore >= 301 ? 'text-yellow-600' : 'text-red-600'

  const bgColor = pfiScore >= 601 ? 'bg-green-100' :
                  pfiScore >= 301 ? 'bg-yellow-100' : 'bg-red-100'

  const barColor = pfiScore >= 601 ? 'from-green-500 to-green-400' :
                   pfiScore >= 301 ? 'from-yellow-500 to-yellow-400' : 'from-red-500 to-red-400'

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Professional Fidelity Index</h1>
            <p className="text-gray-600 mt-1">Track your reputation and trust score</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
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

          <h2 className="text-5xl font-bold text-gray-900 mb-2">{pfiScore}</h2>
          <p className={`text-xl font-medium ${scoreColor} mb-6`}>{scoreLevel}</p>

          {/* Color-coded progress bar */}
          <div className="w-full max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`bg-gradient-to-r ${barColor} h-4 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min((pfiScore / 1000) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000</span>
            </div>
            <div className="flex justify-between mt-1 text-xs font-medium">
              <span className="text-red-500">Poor</span>
              <span className="text-yellow-500">Average</span>
              <span className="text-green-500">Excellent</span>
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

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">PFI Score</span>
                <span className="font-semibold text-gray-900">{pfiScore} / 1000</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${barColor} h-2 rounded-full`}
                  style={{ width: `${(pfiScore / 1000) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Trust Score</span>
                <span className="font-semibold text-gray-900">{trustScore} / 1000</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                  style={{ width: `${(trustScore / 1000) * 100}%` }}
                />
              </div>
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
            {pfiScore >= 800 && (
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-700">Top Performer</span>
              </div>
            )}
            {pfiScore >= 600 && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Reliable Freelancer</span>
              </div>
            )}
            {pfiScore >= 400 && (
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Consistent Quality</span>
              </div>
            )}
            {pfiScore < 400 && (
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-gray-700">Room for Growth</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* How Score Updates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Info className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">How Your Score Updates</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Your PFI score updates automatically each time a milestone is reviewed by the AI quality system.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="font-medium text-green-700">Milestone Passed</p>
            <p className="text-2xl font-bold text-green-600">+10</p>
            <p className="text-sm text-green-600">points</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="font-medium text-red-700">Milestone Failed</p>
            <p className="text-2xl font-bold text-red-600">-15</p>
            <p className="text-sm text-red-600">points</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="font-medium text-yellow-700">Milestone Delayed</p>
            <p className="text-2xl font-bold text-yellow-600">-5</p>
            <p className="text-sm text-yellow-600">points</p>
          </div>
        </div>
      </motion.div>

      {/* Tips for Improvement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-[#AD7D56] to-[#8B6344] rounded-xl shadow-sm p-6 text-white"
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
