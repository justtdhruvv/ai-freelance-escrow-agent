'use client'

import { motion } from 'framer-motion'
import { User, Github, CreditCard, Lock } from 'lucide-react'
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from '../../store/api/projectsApi'
import { useGetWalletQuery } from '../../store/api/walletApi'
import { useState } from 'react'

export default function SettingsPage() {
  const { data: userProfile, isLoading, error } = useGetUserProfileQuery()
  const [updateUserProfile, { isLoading: isSaving }] = useUpdateUserProfileMutation()
  const { data: walletData } = useGetWalletQuery(undefined, {
    skip: userProfile?.role !== 'freelancer'
  })

  const [githubToken, setGithubToken] = useState('')
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSaveGithub = async () => {
    try {
      await updateUserProfile({ github_token: githubToken }).unwrap()
      setSaveMessage({ type: 'success', text: 'GitHub token saved successfully' })
      setGithubToken('')
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save GitHub token' })
    }
    setTimeout(() => setSaveMessage(null), 3000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#AD7D56] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Loading settings...</p>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center">
        <p className="text-red-600">Failed to load settings</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1EC] p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Section 1: Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#AD7D56]" />
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900">{userProfile.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                userProfile.role === 'employer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {userProfile.role === 'employer' ? 'Employer' : 'Freelancer'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
              <p className="text-gray-900">{new Date(userProfile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Profile Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-5 h-5 text-[#AD7D56]" />
            <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Token</label>
            {userProfile.github_token && (
              <p className="text-xs text-gray-500 mb-2">
                Current token: {userProfile.github_token.substring(0, 10)}...
              </p>
            )}
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for AQA code quality checks on your submissions
            </p>
            {saveMessage && (
              <p className={`text-sm mt-2 ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage.text}
              </p>
            )}
            <button
              onClick={handleSaveGithub}
              disabled={isSaving || !githubToken}
              className="mt-3 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Token'}
            </button>
          </div>
        </div>

        {/* Section 3: Payment Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-[#AD7D56]" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Simulated Payments</p>
            <p className="text-sm text-blue-700">
              Payments in this demo are fully simulated — no real payment account is needed.
              Escrow funds are credited automatically when AQA checks pass.
            </p>
          </div>
          {userProfile.role === 'freelancer' && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Wallet Balance</label>
              <p className="text-2xl font-bold text-gray-900">
                {walletData
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(walletData.balance / 100)
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Available credits from completed milestones</p>
            </div>
          )}
        </div>

        {/* Section 4: Security */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-[#AD7D56]" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-700">
              To change your password, log out and use the forgot password flow on the login page.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
