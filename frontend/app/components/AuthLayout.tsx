'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F1EC] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  {title}
                </motion.h1>
              )}
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
