'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { useMessages } from '@/hooks/useMessages'

interface ChatAreaProps {
  conversationId: string | null
  onCreateConversation: () => Promise<string | null>
}

export function ChatArea({ conversationId, onCreateConversation }: ChatAreaProps) {
  const { messages, loading, addMessage } = useMessages(conversationId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    setSending(true)
    try {
      // Create conversation if it doesn't exist
      let activeConversationId = conversationId
      if (!activeConversationId) {
        const newConvId = await onCreateConversation()
        if (!newConvId) {
          console.error('Failed to create conversation')
          return
        }
        activeConversationId = newConvId
        // Wait a bit for the conversation to be created and state to update
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      await addMessage({ role: 'user', content: input })
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceInput = () => {
    // Placeholder for voice input functionality
    // This would integrate with the voice recording hook
    console.log('Voice input clicked')
    setIsRecording(!isRecording)
    // TODO: Integrate with actual voice recording functionality
  }

  const handleStopGenerating = () => {
    // Placeholder for stopping generation
    console.log('Stop generating clicked')
    setSending(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollAreaRef}>
        {!conversationId ? (
          <div className="flex items-center justify-center h-full">
            <h1 className="text-3xl font-semibold text-[#2F2F2F]">
              How can I help you today?
            </h1>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-[#2F2F2F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-[#2F2F2F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-[#2F2F2F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#8E8EA0] text-sm">
              Start the conversation
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.created_at}
              />
            ))}

            {sending && (
              <MessageBubble
                role="assistant"
                content=""
                timestamp={new Date().toISOString()}
                isLoading
              />
            )}
          </>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="w-full border-t border-[#E5E7EB] bg-white">
        <div className="max-w-[48rem] mx-auto px-3 sm:px-5 py-3 sm:py-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            disabled={sending}
            isGenerating={sending}
            onVoiceInput={handleVoiceInput}
            onStopGenerating={handleStopGenerating}
          />

          {/* Footer Disclaimer */}
          <p className="text-center text-[10px] sm:text-[11px] text-[#8E8EA0] mt-2 hidden sm:block">
            ChatGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  )
}
