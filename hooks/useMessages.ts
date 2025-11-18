/**
 * useMessages Hook
 * 
 * Custom React hook for managing messages within a conversation.
 * Provides message fetching, adding, deletion with optimistic updates,
 * loading and error states.
 * 
 * Requirements: 5.1, 5.2, 5.6
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MessageService } from '@/services/database/messageService'
import type { Message } from '@/types/database'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

export interface UseMessagesOptions {
  autoLoad?: boolean
  enableRealtime?: boolean
}

export interface AddMessageInput {
  role: 'user' | 'assistant' | 'system'
  content: string
  parts?: any
}

export interface UseMessagesReturn {
  // Data
  messages: Message[]
  loading: boolean
  error: Error | null
  
  // Actions
  addMessage: (input: AddMessageInput) => Promise<Message | null>
  deleteMessage: (messageId: string) => Promise<boolean>
  
  // Utilities
  refresh: () => Promise<void>
  clearMessages: () => void
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing messages in a conversation
 * 
 * @param conversationId - The conversation ID (optional)
 * @param options - Configuration options
 * @returns Message data and management functions
 * 
 * @example
 * ```tsx
 * function ChatMessages({ conversationId }: { conversationId: string }) {
 *   const { messages, loading, addMessage } = useMessages(conversationId)
 *   
 *   if (loading) return <div>Loading messages...</div>
 *   
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *       <button onClick={() => addMessage({ role: 'user', content: 'Hello!' })}>
 *         Send Message
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useMessages(
  conversationId?: string | null,
  options: UseMessagesOptions = {}
): UseMessagesReturn {
  const { autoLoad = true, enableRealtime = false } = options
  const { user } = useAuth()
  
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState<Error | null>(null)
  
  // Service instance
  const messageService = useRef(new MessageService()).current
  
  // Track optimistic message IDs
  const optimisticIds = useRef(new Set<string>()).current
  
  /**
   * Load messages from database
   */
  const loadMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const data = await messageService.getMessages(conversationId)
      setMessages(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages')
      setError(error)
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId, user, messageService])
  
  /**
   * Load messages on mount and when conversation changes
   */
  useEffect(() => {
    if (autoLoad) {
      loadMessages()
    }
  }, [autoLoad, loadMessages])
  
  /**
   * Set up real-time subscription (optional)
   */
  useEffect(() => {
    if (!enableRealtime || !conversationId) {
      return
    }
    
    // TODO: Implement Supabase real-time subscription
    // This is marked as optional in the task requirements
    // Can be implemented in a future iteration
    
    // Example implementation:
    // const subscription = supabase
    //   .channel(`messages:${conversationId}`)
    //   .on('postgres_changes', {
    //     event: 'INSERT',
    //     schema: 'public',
    //     table: 'messages',
    //     filter: `conversation_id=eq.${conversationId}`
    //   }, (payload) => {
    //     setMessages(prev => [...prev, payload.new as Message])
    //   })
    //   .subscribe()
    //
    // return () => {
    //   subscription.unsubscribe()
    // }
  }, [enableRealtime, conversationId])
  
  /**
   * Add a new message with optimistic update and AI response
   */
  const addMessage = useCallback(
    async (input: AddMessageInput): Promise<Message | null> => {
      const { role, content, parts } = input

      if (!conversationId) {
        toast.error('No conversation selected')
        return null
      }

      if (!user) {
        toast.error('You must be logged in to send messages')
        return null
      }

      // Create optimistic user message
      const optimisticId = `optimistic_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const optimisticMessage: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        role,
        content,
        parts: parts || null,
        created_at: new Date().toISOString(),
      }

      // Add optimistic message to state
      optimisticIds.add(optimisticId)
      setMessages(prev => [...prev, optimisticMessage])

      try {
        // Call AI chat API
        const response = await fetch('/api/chat/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Get session token if available
            ...(user ? {} : {})
          },
          body: JSON.stringify({
            conversationId,
            message: content,
            userId: user.id
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to send message')
        }

        const data = await response.json()

        // Remove optimistic message and reload all messages from database
        // (this will include both the user message and AI response)
        optimisticIds.delete(optimisticId)
        await loadMessages()

        return data.message
      } catch (err) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId))
        optimisticIds.delete(optimisticId)

        const error = err instanceof Error ? err : new Error('Failed to send message')
        setError(error)
        console.error('Error adding message:', error)
        toast.error('Failed to send message')
        return null
      }
    },
    [conversationId, user, optimisticIds, loadMessages]
  )
  
  /**
   * Delete a message
   */
  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!user) {
        toast.error('You must be logged in to delete messages')
        return false
      }
      
      // Store message for potential rollback
      const messageToDelete = messages.find(m => m.id === messageId)
      if (!messageToDelete) {
        toast.error('Message not found')
        return false
      }
      
      // Optimistically remove from state
      setMessages(prev => prev.filter(m => m.id !== messageId))
      
      try {
        await messageService.deleteMessage(messageId)
        toast.success('Message deleted')
        return true
      } catch (err) {
        // Rollback on error
        setMessages(prev => {
          const index = prev.findIndex(m => 
            new Date(m.created_at) > new Date(messageToDelete.created_at)
          )
          if (index === -1) {
            return [...prev, messageToDelete]
          }
          return [
            ...prev.slice(0, index),
            messageToDelete,
            ...prev.slice(index)
          ]
        })
        
        const error = err instanceof Error ? err : new Error('Failed to delete message')
        setError(error)
        console.error('Error deleting message:', error)
        toast.error('Failed to delete message')
        return false
      }
    },
    [user, messages, messageService]
  )
  
  /**
   * Refresh messages from database
   */
  const refresh = useCallback(async () => {
    await loadMessages()
  }, [loadMessages])
  
  /**
   * Clear messages from state (useful when switching conversations)
   */
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    optimisticIds.clear()
  }, [optimisticIds])
  
  return {
    // Data
    messages,
    loading,
    error,
    
    // Actions
    addMessage,
    deleteMessage,
    
    // Utilities
    refresh,
    clearMessages,
  }
}
