'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, MessageSquare, Trash2, X, Search, FileText, BookOpen, Briefcase, HelpCircle, LogOut, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentConversationId: string | null
  onConversationSelect: (id: string) => void
}

export function Sidebar({
  isOpen,
  onClose,
  currentConversationId,
  onConversationSelect,
}: SidebarProps) {
  const { conversations, createConversation, deleteConversation, loading } = useConversations()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleNewChat = async () => {
    const newConv = await createConversation('New Conversation')
    if (newConv) {
      onConversationSelect(newConv.id)
    }
  }

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // Escape to clear search or close sidebar
      if (e.key === 'Escape') {
        if (showUserMenu) {
          setShowUserMenu(false)
        } else if (searchQuery) {
          setSearchQuery('')
        } else if (window.innerWidth < 1024) { // Mobile only
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery, onClose, showUserMenu])

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id)
      if (currentConversationId === id) {
        const nextConv = conversations.find(c => c.id !== id)
        if (nextConv) {
          onConversationSelect(nextConv.id)
        }
      }
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      // Use window.location for a full page reload to clear all state
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect anyway
      window.location.href = '/login'
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] bg-[#171717] flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header with Product Name */}
        <div className="p-2 pt-3 space-y-2">
          {/* Product Name */}
          <div className="px-3 py-2">
            <h1 className="text-white text-[18px] font-semibold">MSME Mitr</h1>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 bg-white/5 hover:bg-white/10 text-white text-[13px] rounded-lg pl-9 pr-3 placeholder:text-white/40 focus:outline-none focus:bg-white/10 transition-colors"
            />
            {/* Keyboard hint */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30 pointer-events-none">
              ⌘K
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-2 py-2 space-y-0.5">
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full h-11 bg-transparent hover:bg-white/5 text-white text-[14px] font-normal rounded-lg flex items-center justify-start gap-3 px-2 py-2.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New chat</span>
          </Button>

          {/* MSME-Specific Menu Items */}
          <button
            onClick={() => router.push('/schemes')}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 text-white/90 text-[14px] transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Browse Schemes</span>
          </button>

          <button
            onClick={() => router.push('/applications')}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 text-white/90 text-[14px] transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            <span>My Applications</span>
          </button>

          <button
            onClick={() => router.push('/resources')}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 text-white/90 text-[14px] transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Resources</span>
          </button>

          <button
            onClick={() => router.push('/help')}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 text-white/90 text-[14px] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help & Support</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mx-2" />

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Section Header */}
          {conversations.length > 0 && (
            <div className="px-3 py-2 text-[11px] text-white/50 font-medium uppercase tracking-wider">
              Chats
            </div>
          )}

          {loading ? (
            <div className="text-center text-white/40 text-[13px] py-8 px-3">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-white/40" />
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed">
                No conversations yet
                <br />
                Start a new chat to begin
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <p className="text-white/40 text-[13px] leading-relaxed">
                No matching conversations
              </p>
            </div>
          ) : (
            <div className="px-2 space-y-0.5">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group relative flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer transition-all',
                    currentConversationId === conv.id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  )}
                  onClick={() => onConversationSelect(conv.id)}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-white/60" />
                  <span className="flex-1 text-[13px] truncate text-white/90 leading-tight">
                    {conv.title || 'New Conversation'}
                  </span>

                  {/* Delete button (show on hover) */}
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                    onClick={(e) => handleDelete(conv.id, e)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white/60 hover:text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Account Section */}
        <div className="border-t border-white/10 p-2">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 text-white/90 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-[13px] font-medium truncate">
                  {user?.email || 'User'}
                </p>
              </div>
              <div className="text-white/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#2A2A2A] rounded-lg border border-white/10 shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    router.push('/dashboard')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-white/90 text-[13px] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <div className="h-px bg-white/10" />
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-white/90 text-[13px] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Close button for mobile */}
        <button
          className="absolute top-3 right-3 lg:hidden text-white/60 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </aside>
    </>
  )
}
