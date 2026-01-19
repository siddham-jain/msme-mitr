// Example usage of database types
// This file demonstrates how to use the TypeScript types with Supabase

import type {
  Database,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  Conversation,
  ConversationInsert,
  ConversationUpdate,
  Message,
  MessageInsert,
  Scheme,
  UserScheme,
  UserSchemeInsert,
  ConversationWithMessages,
  TableRow,
  TableInsert,
  TableUpdate,
} from './database'

import type {
  SupabaseResponse,
  hasSupabaseError,
  hasSupabaseData,
} from './supabase'

// ============================================================================
// Example 1: Creating a typed Supabase client
// ============================================================================

/*
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
*/

// ============================================================================
// Example 2: Querying user profiles
// ============================================================================

async function getUserProfile(supabase: any, userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  // data is typed as UserProfile
  return data
}

// ============================================================================
// Example 3: Creating a new user profile
// ============================================================================

async function createUserProfile(
  supabase: any,
  userId: string,
  email: string,
  fullName?: string
): Promise<UserProfile | null> {
  const newProfile: UserProfileInsert = {
    id: userId,
    email: email,
    full_name: fullName || null,
    role: 'user', // Default role
    language: 'en',
    preferred_model: 'openai/gpt-4o-mini',
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(newProfile)
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}

// ============================================================================
// Example 4: Updating a user profile
// ============================================================================

async function updateUserProfile(
  supabase: any,
  userId: string,
  updates: UserProfileUpdate
): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
    return false
  }

  return true
}

// ============================================================================
// Example 5: Creating a conversation
// ============================================================================

async function createConversation(
  supabase: any,
  userId: string,
  title?: string
): Promise<Conversation | null> {
  const newConversation: ConversationInsert = {
    user_id: userId,
    session_id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    title: title || 'New Chat',
    language: 'en',
    model: 'openai/gpt-4o-mini',
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert(newConversation)
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return null
  }

  return data
}

// ============================================================================
// Example 6: Getting conversations with messages
// ============================================================================

async function getConversationWithMessages(
  supabase: any,
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages (*)
    `)
    .eq('id', conversationId)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    return null
  }

  // data is typed as ConversationWithMessages
  return data
}

// ============================================================================
// Example 7: Adding a message to a conversation
// ============================================================================

async function addMessage(
  supabase: any,
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<Message | null> {
  const newMessage: MessageInsert = {
    conversation_id: conversationId,
    role: role,
    content: content,
  }

  const { data, error } = await supabase
    .from('messages')
    .insert(newMessage)
    .select()
    .single()

  if (error) {
    console.error('Error adding message:', error)
    return null
  }

  // Update conversation message count
  await supabase.rpc('increment_message_count', {
    conversation_id: conversationId,
  })

  return data
}

// ============================================================================
// Example 8: Saving a scheme for a user
// ============================================================================

async function saveScheme(
  supabase: any,
  userId: string,
  schemeId: string,
  notes?: string
): Promise<UserScheme | null> {
  const userScheme: UserSchemeInsert = {
    user_id: userId,
    scheme_id: schemeId,
    status: 'saved',
    notes: notes || null,
  }

  const { data, error } = await supabase
    .from('user_schemes')
    .insert(userScheme)
    .select()
    .single()

  if (error) {
    console.error('Error saving scheme:', error)
    return null
  }

  return data
}

// ============================================================================
// Example 9: Generic function using helper types
// ============================================================================

async function getRecordById<T extends keyof Database['public']['Tables']>(
  supabase: any,
  table: T,
  id: string
): Promise<TableRow<T> | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching ${table}:`, error)
    return null
  }

  return data
}

// Usage:
// const profile = await getRecordById(supabase, 'user_profiles', userId)
// const conversation = await getRecordById(supabase, 'conversations', convId)

// ============================================================================
// Example 10: Batch operations with type safety
// ============================================================================

async function createConversationWithFirstMessage(
  supabase: any,
  userId: string,
  userMessage: string
): Promise<{ conversation: Conversation; message: Message } | null> {
  // Create conversation
  const conversation = await createConversation(supabase, userId)
  if (!conversation) return null

  // Add first message
  const message = await addMessage(supabase, conversation.id, 'user', userMessage)
  if (!message) return null

  return { conversation, message }
}

// ============================================================================
// Example 11: Filtering and sorting with type safety
// ============================================================================

async function getUserConversations(
  supabase: any,
  userId: string,
  options?: {
    archived?: boolean
    limit?: number
    offset?: number
  }
): Promise<Conversation[]> {
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)

  if (options?.archived !== undefined) {
    query = query.eq('is_archived', options.archived)
  }

  query = query.order('last_active_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return data || []
}

// ============================================================================
// Example 12: Complex queries with joins
// ============================================================================

async function getUserSavedSchemesWithDetails(
  supabase: any,
  userId: string
): Promise<Array<UserScheme & { scheme: Scheme }>> {
  const { data, error } = await supabase
    .from('user_schemes')
    .select(`
      *,
      scheme:schemes (*)
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved schemes:', error)
    return []
  }

  return data || []
}

// ============================================================================
// Example 13: Updating conversation metadata
// ============================================================================

async function archiveConversation(
  supabase: any,
  conversationId: string
): Promise<boolean> {
  const updates: ConversationUpdate = {
    is_archived: true,
  }

  const { error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)

  if (error) {
    console.error('Error archiving conversation:', error)
    return false
  }

  return true
}

// ============================================================================
// Example 14: Searching schemes
// ============================================================================

async function searchSchemes(
  supabase: any,
  searchTerm: string,
  category?: string
): Promise<Scheme[]> {
  let query = supabase
    .from('schemes')
    .select('*')
    .eq('is_active', true)

  if (category) {
    query = query.eq('category', category)
  }

  // Search in scheme name and description
  query = query.or(`scheme_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

  const { data, error } = await query

  if (error) {
    console.error('Error searching schemes:', error)
    return []
  }

  return data || []
}

// ============================================================================
// Example 15: Transaction-like operations
// ============================================================================

async function deleteConversationAndMessages(
  supabase: any,
  conversationId: string
): Promise<boolean> {
  // Due to CASCADE DELETE, we only need to delete the conversation
  // Messages will be automatically deleted
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    console.error('Error deleting conversation:', error)
    return false
  }

  return true
}

export {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  createConversation,
  getConversationWithMessages,
  addMessage,
  saveScheme,
  getRecordById,
  createConversationWithFirstMessage,
  getUserConversations,
  getUserSavedSchemesWithDetails,
  archiveConversation,
  searchSchemes,
  deleteConversationAndMessages,
}
