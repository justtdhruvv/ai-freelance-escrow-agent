'use client'

import { motion } from 'framer-motion'
import { User, Mail, Shield, Clock, CreditCard, Github, Calendar, TrendingUp, AlertCircle, X, Edit2 } from 'lucide-react'
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from '../../store/api/projectsApi'
import { useState } from 'react'

export default function ProfilePage() {
  const { 
    data: userProfile, 
    isLoading, 
    error 
  } = useGetUserProfileQuery()

  const [updateUserProfile] = useUpdateUserProfileMutation()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    stripe_account_id: '',
    razorpay_account_id: '',
    github_token: ''
  })

  const handleEditProfile = () => {
    if (userProfile) {
      setEditForm({
        stripe_account_id: userProfile.stripe_account_id || '',
        razorpay_account_id: userProfile.razorpay_account_id || '',
        github_token: userProfile.github_token || ''
      })
      setShowEditModal(true)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(editForm).unwrap()
      setShowEditModal(false)
      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  console.log('Profile page data:', { userProfile, isLoading, error })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AD7D56]"></div>
        <p className="ml-4 text-gray-600">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load profile</h2>
          <p className="text-gray-600">Error: {JSON.stringify(error)}</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No profile data found</h2>
          <p className="text-gray-600">Please check your account settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your account information and settings</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                  userProfile.role === 'employer' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userProfile.role === 'employer' ? 'Employer' : 'Freelancer'}
                </span>
              </div>
            </div>
          </div>

          {/* Simple Profile Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{userProfile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900 text-sm">{userProfile.user_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900 capitalize">{userProfile.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PFI Score</label>
                <p className="text-gray-900">{userProfile.pfi_score}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trust Score</label>
                <p className="text-gray-900">{userProfile.trust_score}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  userProfile.grace_period_active === 1 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {userProfile.grace_period_active === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <p className="text-gray-900">
                  {new Date(userProfile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment & Integration Accounts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h2>
            
            <div className="space-y-4">
              {/* Stripe */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Stripe Account</p>
                    <p className="text-xs text-gray-500">Payment processing</p>
                    {userProfile.stripe_account_id && (
                      <p className="text-xs text-gray-400 mt-1">ID: {userProfile.stripe_account_id}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {/* {userProfile.stripe_account_id ? ( */}
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Connected
                    </span>
                  {/* ) : ( */}
                    {/* <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      Not Connected
                    </span> */}
                  {/* )} */}
                </div>
              </div>

              {/* Razorpay */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">R</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Razorpay Account</p>
                    <p className="text-xs text-gray-500">Indian payment gateway</p>
                    {userProfile.razorpay_account_id && (
                      <p className="text-xs text-gray-400 mt-1">ID: {userProfile.razorpay_account_id}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {/* {userProfile.razorpay_account_id ? ( */}
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Connected
                    </span>
                  {/* ) : ( */}
                    {/* <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      Not Connected
                    </span> */}
                  {/* )} */}
                </div>
              </div>

              {/* GitHub */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-gray-800" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">GitHub Account</p>
                    <p className="text-xs text-gray-500">Code repository integration</p>
                    {userProfile.github_token && (
                      <p className="text-xs text-gray-400 mt-1">Token: {userProfile.github_token.substring(0, 10)}...</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {/* {userProfile.github_token ? ( */}
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Connected
                    </span>
                  {/* // ) : ( */}
                    {/* <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      Not Connected
                    </span> */}
                  {/* // )} */}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Stripe Account ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Account ID
                </label>
                <input
                  type="text"
                  value={editForm.stripe_account_id}
                  onChange={(e) => handleInputChange('stripe_account_id', e.target.value)}
                  placeholder="acct_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your Stripe Connect account ID</p>
              </div>

              {/* Razorpay Account ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razorpay Account ID
                </label>
                <input
                  type="text"
                  value={editForm.razorpay_account_id}
                  onChange={(e) => handleInputChange('razorpay_account_id', e.target.value)}
                  placeholder="rzp_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your Razorpay account ID</p>
              </div>

              {/* GitHub Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Token
                </label>
                <input
                  type="password"
                  value={editForm.github_token}
                  onChange={(e) => handleInputChange('github_token', e.target.value)}
                  placeholder="ghp_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your GitHub personal access token</p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
