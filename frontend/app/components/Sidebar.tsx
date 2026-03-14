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

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderOpen, label: 'Projects', href: '/dashboard/projects' },
  { icon: Users, label: 'Clients', href: '/dashboard/clients' },
  { icon: Target, label: 'Milestones', href: '/dashboard/milestones' },
  { icon: Wallet, label: 'Escrow Wallet', href: '/dashboard/wallet' },
  { icon: Brain, label: 'AI Reviews', href: '/dashboard/ai-reviews' },
  { icon: TrendingUp, label: 'PFI Score', href: '/dashboard/pfi-score' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

interface SidebarProps {
  collapsed: boolean
  toggleSidebar: () => void
  isMobile: boolean
  onClose?: () => void
}

export default function Sidebar({ collapsed, toggleSidebar, isMobile, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleMenuClick = (href: string) => {
    router.push(href)
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <div 
      className={`bg-[#111111] h-screen overflow-hidden transition-[width] duration-200 ${
        isMobile ? 'w-64' : collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className={`flex items-center ${
        collapsed ? 'justify-center' : 'justify-between'
      } px-4 py-4 border-b border-gray-800 h-16`}>
        {/* Logo */}
        <span
          className={`transition-all duration-200 whitespace-nowrap font-semibold text-[#F5F1EC] ${
            collapsed
              ? "opacity-0 w-0 overflow-hidden"
              : "opacity-100 w-auto"
          }`}
        >
          AI ESCROW
        </span>
        
        {/* Toggle Button */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-[#AD7D56]/20 transition-colors"
          >
            {collapsed ? (
              <Menu className="w-5 h-5 text-[#CDB49E]" />
            ) : (
              <X className="w-5 h-5 text-[#CDB49E]" />
            )}
          </button>
        )}
      </div>
      
      {/* Navigation Menu */}
      <nav className="px-2 py-4 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleMenuClick(item.href)}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors duration-200 h-10 ${
              pathname === item.href 
                ? 'bg-[#AD7D56] text-white' 
                : 'text-[#F5F1EC] hover:bg-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span
              className={`transition-all duration-200 whitespace-nowrap font-medium text-sm ${
                collapsed
                  ? "opacity-0 w-0 overflow-hidden"
                  : "opacity-100 w-auto"
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
