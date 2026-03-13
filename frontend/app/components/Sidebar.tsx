'use client'

import { 
  LayoutDashboard, 
  FolderOpen, 
  Target, 
  Wallet, 
  Brain, 
  TrendingUp, 
  Settings,
  Menu,
  X
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: FolderOpen, label: 'Projects', active: false },
  { icon: Target, label: 'Milestones', active: false },
  { icon: Wallet, label: 'Escrow Wallet', active: false },
  { icon: Brain, label: 'AI Reviews', active: false },
  { icon: TrendingUp, label: 'PFI Score', active: false },
  { icon: Settings, label: 'Settings', active: false },
]

interface SidebarProps {
  collapsed: boolean
  toggleSidebar: () => void
  isMobile: boolean
}

export default function Sidebar({ collapsed, toggleSidebar, isMobile }: SidebarProps) {
  return (
    <div 
      className={`bg-[#111111] h-screen overflow-hidden transition-[width] duration-200 ${
        isMobile ? 'hidden' : ''
      } ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Sidebar Header */}
      <div className={`flex items-center ${
        collapsed ? 'justify-center' : 'justify-between'
      } px-4 py-4 border-b border-gray-800`}>
        {/* Logo */}
        {!collapsed && (
          <span className="text-[#F5F1EC] font-semibold">AI ESCROW</span>
        )}
        
        {/* Toggle Button */}
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
      </div>
      
      {/* Navigation Menu */}
      <nav className="px-2 py-4 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2' : 'gap-3 px-4'
            } py-3 rounded-lg transition-colors duration-200 ${
              item.active 
                ? 'bg-[#AD7D56] text-white' 
                : 'text-[#F5F1EC] hover:bg-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium text-sm whitespace-nowrap">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
