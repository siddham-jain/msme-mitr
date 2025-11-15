/**
 * useConversations Hook
 * 
 * Custom React hook for managing conversations with the database.
 * Provides conversation list fetching, creation, deletion, and updates
 * with loading and error states.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ConversationService } from '@/services/database/conversationService'
import type { Conversation, ConversationUpdate } from '@/types/database'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

export interface UseConversationsOptions {
  includeArchived?: boolean
  autoLoad?: boolean
}

export interface UseConversationsReturn {
  // Data
  conversations: Conversation[]
  loading: boolean
  error: Error | null
  
  // Actions
  createConversation: (title?: string, language?: string, model?: string) => Promise<Conversation | null>
  deleteConversation: (conversationId: string) => Promise<boolean>
  updateConversation: (conversationId: string, updates: ConversationUpdate) => Promise<Conversation | null>
  archiveConversation: (conversationId: string) => Promise<Conversation | null>
  unarchiveConversation: (conversationId: string) => Promise<Conversation | null>
  pinConversation: (conversationId: string) => Promise<Conversation | null>
  unpinConversation: (conversationId: string) => Promise<Conversation | null>
  
  // Utilities
  refresh: () => Promise<void>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing conversations
 * 
 * @param options - Configuration options
 * @returns Conversation data and management functions
 * 
 * @example
 * ```tsx
 * function ConversationList() {
 *   const { conversations, loading, createConversation, deleteConversation } = useConversations()
 *   
 *   if (loading) return <div>Loading...</div>
 *   
 *   return (
 *     <div>
 *       <button onClick={() => createConversation('New Chat')}>New Chat</button>
 *       {conversations.map(conv => (
 *         <div key={conv.id}>
 *           {conv.title}
 *           <button onClick={() => deleteConversation(conv.id)}>Delete</button>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useConversations(
  options: UseConversationsOptions = {}
): UseConversationsReturn {
  const { includeArchived = false, autoLoad = true } = options
  const { user } = useAuth()
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Track if we've loaded for this user to prevent unnecessary reloads
  const loadedUserIdRef = useRef<string | null>(null)
  const isLoadingRef = useRef(false)
  
  // Service instance
  const conversationService = new ConversationService()
  
  /**
   * Load conversations from database
   */
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      loadedUserIdRef.current = null
      return
    }

    // Prevent concurrent loads
    if (isLoadingRef.current) {
      console.log('[useConversations] Already loading, skipping...')
      return
    }

    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      // Cleanup old empty conversations first (Requirement 9.9, 3.7)
      // Only removes conversations that have been empty for more than 5 minutes
      await conversationService.cleanupEmptyConversations(user.id)

      // Fetch conversations
      const data = await conversationService.getConversations(user.id, includeArchived)

      // Sort: pinned first, then by last_active_at (Requirements 9.1, 9.2)
      // Note: We no longer filter out conversations with 0 messages to allow
      // newly created conversations to appear before the first message is sent
      const sorted = data
        .sort((a, b) => {
          // Pinned conversations first
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          
          // Then sort by last_active_at (newest first)
          return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime()
        })

      setConversations(sorted)
      loadedUserIdRef.current = user.id
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load conversations')
      setError(error)
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [user?.id, includeArchived])
  
  /**
   * Load conversations on mount and when user ID actually changes
   * Prevents unnecessary reloads when user object is recreated with same ID
   */
  useEffect(() => {
    if (autoLoad && user?.id && user.id !== loadedUserIdRef.current) {
      console.log('[useConversations] User ID changed, loading conversations:', user.id)
      loadConversations()
    } else if (autoLoad && !user) {
      // User logged out, clear conversations
      setConversations([])
      setLoading(false)
      loadedUserIdRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, user?.id])
  
  /**
   * Create a new conversation
   */
  const createConversation = useCallback(
    async (
      title?: string,
      language?: string,
      model?: string
    ): Promise<Conversation | null> => {
      if (!user) {
        toast.error('You must be logged in to create a conversation')
        return null
      }
      
      try {
        const newConversation = await conversationService.createConversation(
          user.id,
          title,
          language,
          model
        )
        
        // Add to local state (prepend to list)
        setConversations(prev => [newConversation, ...prev])
        
        // Don't show toast for automatic conversation creation
        // toast.success('Conversation created')
        return newConversation
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create conversation')
        setError(error)
        console.error('Error creating conversation:', error)
        toast.error('Failed to create conversation')
        return null
      }
    },
    [user]
  )
  
  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!user) {
        toast.error('You must be logged in to delete a conversation')
        return false
      }
      
      try {
        await conversationService.deleteConversation(conversationId)
        
        // Remove from local state
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        
        toast.success('Conversation deleted')
        return true
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete conversation')
        setError(error)
        console.error('Error deleting conversation:', error)
        toast.error('Failed to delete conversation')
        return false
      }
    },
    [user]
  )
  
  /**
   * Update a conversation
   */
  const updateConversation = useCallback(
    async (
      conversationId: string,
      updates: ConversationUpdate
    ): Promise<Conversation | null> => {
      if (!user) {
        toast.error('You must be logged in to update a conversation')
        return null
      }
      
      try {
        const updatedConversation = await conversationService.updateConversation(
          conversationId,
          updates
        )
        
        // Update in local state
        setConversations(prev =>
          prev.map(c => (c.id === conversationId ? updatedConversation : c))
        )
        
        toast.success('Conversation updated')
        return updatedConversation
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update conversation')
        setError(error)
        console.error('Error updating conversation:', error)
        toast.error('Failed to update conversation')
        return null
      }
    },
    [user]
  )
  
  /**
   * Archive a conversation (soft delete)
   */
  const archiveConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      if (!user) {
        toast.error('You must be logged in to archive a conversation')
        return null
      }
      
      try {
        const archivedConversation = await conversationService.archiveConversation(conversationId)
        
        // Update in local state or remove if not showing archived
        if (includeArchived) {
          setConversations(prev =>
            prev.map(c => (c.id === conversationId ? archivedConversation : c))
          )
        } else {
          setConversations(prev => prev.filter(c => c.id !== conversationId))
        }
        
        toast.success('Conversation archived')
        return archivedConversation
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to archive conversation')
        setError(error)
        console.error('Error archiving conversation:', error)
        toast.error('Failed to archive conversation')
        return null
      }
    },
    [user, includeArchived]
  )
  
  /**
   * Unarchive a conversation
   */
  const unarchiveConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      if (!user) {
        toast.error('You must be logged in to unarchive a conversation')
        return null
      }
      
      try {
        const unarchivedConversation = await conversationService.unarchiveConversation(conversationId)
        
        // Update in local state
        setConversations(prev =>
          prev.map(c => (c.id === conversationId ? unarchivedConversation : c))
        )
        
        toast.success('Conversation restored')
        return unarchivedConversation
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to unarchive conversation')
        setError(error)
        console.error('Error unarchiving conversation:', error)
        toast.error('Failed to restore conversation')
        return null
      }
    },
    [user]
  )
  
  /**
   * Pin a conversation to the top
   */
  const pinConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      if (!user) {
        toast.error('You must be logged in to pin a conversation')
        return null
      }
      
      try {
        const pinnedConversation = await conversationService.pinConversation(conversationId)
        
        // Update in local state
        setConversations(prev =>
          prev.map(c => (c.id === conversationId ? pinnedConversation : c))
        )
        
        toast.success('Conversation pinned')
        return pinnedConversation
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to pin conversation')
        setError(error)
        console.error('Error pinning conversation:', error)
        toast.error('Failed to pin conversation')
        return null
      }
    },
    [user]
  )
  
  /**
   * Unpin a conversation
   */
  const unpinConversation = useCallback(
    async (conversationId: string): Promise<Conversation | null> => {
      if (!user) {
        toast.error('You must be logged in to unpin a conversation')
        return null
      }
      
      try {
        const unpinnedConversation = await conversationService.unpinConversation(conversationId)
        
        // Update in local state
        setConversations(prev =>
          prev.map(c => (c.id === conversationId ? unpinnedConversation : c))
        )
        
        toast.success('Conversation unpinned')
        return unpinnedConversation
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to unpin conversation')
        setError(error)
        console.error('Error unpinning conversation:', error)
        toast.error('Failed to unpin conversation')
        return null
      }
    },
    [user]
  )
  
  /**
   * Refresh conversations from database
   */
  const refresh = useCallback(async () => {
    await loadConversations()
  }, [loadConversations])
  
  return {
    // Data
    conversations,
    loading,
    error,
    
    // Actions
    createConversation,
    deleteConversation,
    updateConversation,
    archiveConversation,
    unarchiveConversation,
    pinConversation,
    unpinConversation,
    
    // Utilities
    refresh,
  }
}