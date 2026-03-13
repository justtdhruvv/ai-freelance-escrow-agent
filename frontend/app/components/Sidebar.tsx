'use client'

import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  FolderOpen, 
  Target, 
  Wallet, 
  Brain, 
  TrendingUp, 
  Settings
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
  isOpen: boolean
  isMobile: boolean
}

export default function Sidebar({ isOpen, isMobile }: SidebarProps) {
  return (
    <motion.div 
      className={`bg-[#111111] min-h-screen p-4 ${
        isMobile 
          ? 'fixed left-0 top-0 h-full z-40' 
          : 'relative'
      }`}
      initial={isMobile ? { x: -300 } : { width: isOpen ? 256 : 80 }}
      animate={isMobile 
        ? { x: isOpen ? 0 : -300 }
        : { width: isOpen ? 256 : 80 }
      }
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Logo Section */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-[#AD7D56] flex-shrink-0" />
          <motion.h1 
            className="text-white text-xl font-bold overflow-hidden whitespace-nowrap"
            initial={{ width: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
            animate={{ width: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className={`${!isOpen && 'hidden'}`}>AI ESCROW</span>
          </motion.h1>
        </div>
      </motion.div>
      
      {/* Navigation Menu */}
      <nav className="space-y-2">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              item.active 
                ? 'bg-[#AD7D56] text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <motion.span 
              className="font-medium overflow-hidden whitespace-nowrap"
              initial={{ width: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
              animate={{ width: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <span className={`${!isOpen && 'hidden'}`}>{item.label}</span>
            </motion.span>
          </motion.button>
        ))}
      </nav>
    </motion.div>
  )
}
