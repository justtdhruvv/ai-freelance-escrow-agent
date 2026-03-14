'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, User, Paperclip } from 'lucide-react'

interface Project {
  id: string
  name: string
  client: string
  freelancer: string
  totalEscrowAmount: number
  milestones: number
  status: 'active' | 'completed' | 'review' | 'disputed'
  progress: number
  description?: string
  deadline?: string
  startDate?: string
  budget?: number
  riskScore?: number
}

interface MessageModalProps {
  project: Project
  onClose: () => void
}

interface Message {
  id: string
  sender: 'client' | 'freelancer'
  content: string
  timestamp: string
  read: boolean
}

export default function MessageModal({ project, onClose }: MessageModalProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'freelancer',
      content: 'Hi! I\'ve started working on the project setup. I should have the initial planning phase completed by tomorrow.',
      timestamp: '2024-01-16 09:30 AM',
      read: true
    },
    {
      id: '2',
      sender: 'client',
      content: 'That\'s great! Looking forward to seeing the progress. Please keep me updated on any blockers or questions.',
      timestamp: '2024-01-16 10:15 AM',
      read: true
    },
    {
      id: '3',
      sender: 'freelancer',
      content: 'Will do! I\'ve uploaded the initial wireframes to the shared folder. Let me know if you\'d like any changes before I proceed with the development.',
      timestamp: '2024-01-17 02:45 PM',
      read: false
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'client',
        content: message.trim(),
        timestamp: new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        read: true
      }
      
      setMessages(prev => [...prev, newMessage])
      setMessage('')
      
      // Simulate freelancer typing and responding
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        const freelancerResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'freelancer',
          content: 'Thanks for your message! I\'ll review this and get back to you shortly.',
          timestamp: new Date().toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          read: false
        }
        setMessages(prev => [...prev, freelancerResponse])
      }, 2000)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 h-[80vh] max-h-[600px] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#AD7D56] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111111]">{project.freelancer}</h2>
                <p className="text-sm text-gray-600">{project.name}</p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`max-w-xs lg:max-w-md ${msg.sender === 'client' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.sender === 'client'
                        ? 'bg-[#AD7D56] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-1">
                    {msg.timestamp}
                    {msg.sender === 'client' && (
                      <span className="ml-2">
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AD7D56] focus:border-transparent"
                />
                <motion.button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Paperclip className="w-4 h-4" />
                </motion.button>
              </div>
              
              <motion.button
                type="submit"
                disabled={!message.trim()}
                className="px-4 py-2 bg-[#AD7D56] text-white rounded-lg hover:bg-[#8B6344] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: message.trim() ? 1.05 : 1 }}
                whileTap={{ scale: message.trim() ? 0.95 : 1 }}
              >
                <Send className="w-4 h-4" />
                Send
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
