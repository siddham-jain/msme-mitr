'use client'

import { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'
import { CallButton } from './CallButton'
import { Menu } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { cn } from '@/lib/utils'

export function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const { createConversation } = useConversations()

  const handleCreateConversation = useCallback(async () => {
    const newConv = await createConversation('New Conversation')
    if (newConv) {
      setCurrentConversationId(newConv.id)
      return newConv.id
    }
    return null
  }, [createConversation])

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId={currentConversationId}
        onConversationSelect={setCurrentConversationId}
      />

      {/* Main Chat Area */}
      <div
        className={cn(
          "flex flex-col flex-1 transition-all duration-300",
          sidebarOpen ? "ml-[260px]" : "ml-0"
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between h-[52px] px-2 sm:px-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-[#8E8EA0] hover:text-[#40414F] rounded-md hover:bg-gray-100 transition-colors"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-[#2F2F2F] text-sm font-medium">MSME Mitr</h2>
          </div>

          {/* Call Button */}
          <CallButton />
        </header>

        {/* Chat Area */}
        <ChatArea
          conversationId={currentConversationId}
          onCreateConversation={handleCreateConversation}
        />
      </div>
    </div>
  )
}
