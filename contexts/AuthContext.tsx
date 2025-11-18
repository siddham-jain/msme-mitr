'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, UserProfileUpdate, UserProfileInsert } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: UserProfileUpdate) => Promise<void>
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Load user profile from database
   * Creates a new profile if one doesn't exist
   */
  async function loadProfile(userId: string) {
    try {
      // Try to get existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile:', error)
        setProfile(null)
        setLoading(false)
        return
      }

      // If profile exists, use it
      if (data) {
        setProfile(data)
        setLoading(false)
        return
      }

      // If no profile exists, create one
      console.log('No profile found, creating new profile for user:', userId)
      await createProfile(userId)
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
      setLoading(false)
    }
  }

  /**
   * Create a new user profile
   */
  async function createProfile(userId: string) {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userEmail = authData?.user?.email || ''
      const fullName = authData?.user?.user_metadata?.full_name || null

      const profileData: UserProfileInsert = {
        id: userId,
        email: userEmail,
        full_name: fullName,
        role: 'user',
        language: 'en',
        preferred_model: 'gpt-4o-mini',
      }

      const { data, error } = await (supabase
        .from('user_profiles') as any)
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        setProfile(null)
      } else if (data) {
        console.log('Profile created successfully')
        setProfile(data)
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign up a new user with email and password
   */
  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    
    if (error) throw error
  }

  /**
   * Sign in an existing user with email and password
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error

    // Note: last_login_at tracking removed due to Supabase type inference issues
    // The field exists in the database but TypeScript cannot properly infer the update type
    // This can be re-enabled if Supabase types are regenerated or fixed
  }

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  /**
   * Update the current user's profile
   */
  const updateProfile = async (updates: UserProfileUpdate) => {
    if (!user) {
      throw new Error('No user logged in')
    }
    
    const updateData: UserProfileUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    const { error } = await supabase
      .from('user_profiles')
      // @ts-expect-error - Supabase type inference issue with user_profiles table
      .update(updateData)
      .eq('id', user.id)
    
    if (error) throw error
    
    // Reload profile to get updated data
    await loadProfile(user.id)
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
