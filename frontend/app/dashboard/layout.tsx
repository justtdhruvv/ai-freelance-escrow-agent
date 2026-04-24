'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Target,
  Wallet,
  Brain,
  TrendingUp,
  Settings,
  Users,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  User,
  AlertTriangle
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { logout, initializeAuth } from '../store/slices/authSlice'
import { getUserRole } from '../utils/roleGuard'
import { useGetMyDisputesQuery } from '../store/api/projectsApi'

// Define roles properly
type UserRole = 'employer' | 'freelancer'

// Menu config with role-based access
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderOpen, label: 'Projects', href: '/dashboard/projects' },
  { icon: Target, label: 'Milestones', href: '/dashboard/milestones' },
  { icon: Brain, label: 'AI Reviews', href: '/dashboard/ai-reviews' },
  
  // ❌ ONLY freelancer
  { icon: Users, label: 'Clients', href: '/dashboard/clients', roles: ['freelancer'] },
  { icon: Wallet, label: 'Escrow Wallet', href: '/dashboard/wallet', roles: ['freelancer'] },
  { icon: TrendingUp, label: 'PFI Score', href: '/dashboard/pfi-score', roles: ['freelancer'] },
  
  // ✅ BOTH
  { icon: AlertTriangle, label: 'Disputes', href: '/dashboard/disputes' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  console.log('🔥 DASHBOARD LAYOUT RENDERING!')
  
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  // 🔥 Get user role
  const userRole = getUserRole() as UserRole
  const { data: myDisputes } = useGetMyDisputesQuery(undefined, { skip: !user })
  const openDisputeCount = myDisputes?.filter(d => d.status === 'open').length ?? 0
  console.log('🔥 getUserRole() called:', userRole)
  console.log('🔥 localStorage role directly:', typeof window !== 'undefined' ? localStorage.getItem('role') : 'SSR')

  // 🔥 Filter menu based on role
  const filteredMenuItems = menuItems.filter(item => {
    // if no roles defined → show to all
    if (!item.roles) return true

    // check if current role allowed
    return item.roles.includes(userRole)
  })

  // 🔍 DEBUG: Log everything
  console.log('=== LAYOUT SIDEBAR DEBUG ===')
  console.log('Raw userRole from getUserRole():', getUserRole())
  console.log('Type-cast userRole:', userRole)
  console.log('localStorage role:', typeof window !== 'undefined' ? localStorage.getItem('role') : 'SSR')
  console.log('All menu items:', menuItems.map(item => ({ 
    label: item.label, 
    roles: item.roles || 'ALL',
    hasRoles: !!item.roles 
  })))
  console.log('Filtered menu items:', filteredMenuItems.map(item => item.label))
  console.log('=== END LAYOUT SIDEBAR DEBUG ===')

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(initializeAuth())
  }, [dispatch])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      if (mobile) {
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

  const handleMenuClick = (href: string) => {
    router.push(href)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setProfileDropdownOpen(false)
  }, [pathname])

  const handleProfile = () => {
    setProfileDropdownOpen(false)
    router.push('/dashboard/profile')
  }

  const handleLogout = () => {
    dispatch(logout())
    router.push('/login')
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
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`${isMobile
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`
          : `relative transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'
          } ${isMobile ? 'hidden' : 'block'}`
          }`}
      >
        <div className="bg-[#111111] h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            {!sidebarCollapsed && (
              <h1 className="text-white font-bold text-lg">EscrowAI</h1>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.href}
                  onClick={() => handleMenuClick(item.href)}
                  className={`${isActive
                    ? 'bg-[#AD7D56] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    } w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      {item.href === '/dashboard/disputes' && openDisputeCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {openDisputeCount > 9 ? '9+' : openDisputeCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#AD7D56] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects, clients..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-[#AD7D56] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                      <button
                        onClick={handleProfile}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false)
                          router.push('/dashboard/settings')
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Settings
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
