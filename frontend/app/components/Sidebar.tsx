'use client'

import { useRouter, usePathname } from 'next/navigation'
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
  X
} from 'lucide-react'
import { getUserRole } from '../utils/roleGuard'
import { useEffect } from 'react'

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
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

interface SidebarProps {
  collapsed: boolean
  toggleSidebar: () => void
  isMobile: boolean
  onClose?: () => void
}

export default function Sidebar({
  collapsed,
  toggleSidebar,
  isMobile,
  onClose
}: SidebarProps) {
  console.log('🔥 SIDEBAR COMPONENT RENDERING!')
  
  const router = useRouter()
  const pathname = usePathname()

  const userRole = getUserRole() as UserRole
  
  console.log('🔥 getUserRole() called:', userRole)
  console.log('🔥 localStorage role directly:', localStorage.getItem('role'))

  const handleMenuClick = (href: string) => {
    router.push(href)
    if (isMobile && onClose) {
      onClose()
    }
  }

  // 🔥 Filter menu based on role
  const filteredMenuItems = menuItems.filter(item => {
    // if no roles defined → show to all
    if (!item.roles) return true

    // check if current role allowed
    return item.roles.includes(userRole)
  })

  // 🔍 DEBUG: Log everything
  console.log('=== SIDEBAR DEBUG ===')
  console.log('Raw userRole from getUserRole():', getUserRole())
  console.log('Type-cast userRole:', userRole)
  console.log('localStorage role:', localStorage.getItem('role'))
  console.log('All menu items:', menuItems.map(item => ({ 
    label: item.label, 
    roles: item.roles || 'ALL',
    hasRoles: !!item.roles 
  })))
  console.log('Filtered menu items:', filteredMenuItems.map(item => item.label))
  console.log('=== END SIDEBAR DEBUG ===')

  return (
    <div
      className={`bg-[#111111] h-screen overflow-hidden transition-[width] duration-200 ${
        isMobile ? 'w-64' : collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center ${
          collapsed ? 'justify-center' : 'justify-between'
        } px-4 py-4 border-b border-gray-800 h-16`}
      >
        <span
          className={`transition-all duration-200 whitespace-nowrap font-semibold text-[#F5F1EC] ${
            collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}
        >
          AI ESCROW
        </span>

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-[#AD7D56]/20"
          >
            {collapsed ? (
              <Menu className="w-5 h-5 text-[#CDB49E]" />
            ) : (
              <X className="w-5 h-5 text-[#CDB49E]" />
            )}
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="px-2 py-4 space-y-2">
        {filteredMenuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleMenuClick(item.href)}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors h-10 ${
              pathname === item.href
                ? 'bg-[#AD7D56] text-white'
                : 'text-[#F5F1EC] hover:bg-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span
              className={`transition-all duration-200 whitespace-nowrap font-medium text-sm ${
                collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}