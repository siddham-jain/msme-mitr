'use client'

/**
 * Standalone Auth Debug Page
 *
 * This page is OUTSIDE the admin layout so it can be accessed even if
 * the admin layout is stuck on loading.
 */

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/database'

export default function DebugAuthPage() {
  const { user, profile, loading } = useAuth()
  const [logs, setLogs] = useState<string[]>([])
  const [manualQuery, setManualQuery] = useState<UserProfile | null>(null)
  const [manualError, setManualError] = useState<any>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const log = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, log])
    console.log(`[DEBUG PAGE] ${message}`)
  }

  // Track time elapsed
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    addLog('🚀 Debug page mounted')

    return () => clearInterval(interval)
  }, [])

  // Watch auth state changes
  useEffect(() => {
    addLog(`📊 State: loading=${loading}, user=${!!user}, profile=${!!profile}`)

    if (loading) {
      addLog('⏳ Still loading...')
    } else {
      addLog('✅ Loading complete!')
    }

    if (user && !loading && !profile) {
      addLog('⚠️ WARNING: User exists but profile is null after loading!')
    }
  }, [loading, user, profile])

  const runManualQuery = async () => {
    addLog('🔍 Running manual query...')
    const supabase = createClient()

    try {
      // Step 1: Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        addLog(`❌ Session error: ${sessionError.message}`)
        setManualError(sessionError)
        return
      }

      if (!session) {
        addLog('❌ No session found')
        return
      }

      addLog(`✅ Session found for ${session.user.email}`)

      // Step 2: Query profile
      addLog(`🔎 Querying profile for user ${session.user.id}...`)

      const queryStartTime = Date.now()

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single<UserProfile>()

      const queryDuration = Date.now() - queryStartTime

      if (error) {
        addLog(`❌ Query failed in ${queryDuration}ms: ${error.message}`)
        addLog(`   Code: ${error.code}`)
        addLog(`   Details: ${JSON.stringify(error.details)}`)
        setManualError(error)
      } else if (data) {
        addLog(`✅ Query succeeded in ${queryDuration}ms`)
        addLog(`   Profile: ${data.email}, role: ${data.role}`)
        setManualQuery(data)
      }

    } catch (err: any) {
      addLog(`💥 Exception: ${err.message}`)
      setManualError(err)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🔍 Auth Debug Console</h1>
            <p className="text-muted-foreground mt-1">Real-time authentication diagnostics</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono">{timeElapsed}s</div>
            <div className="text-xs text-muted-foreground">Time elapsed</div>
          </div>
        </div>

        {/* Alert if stuck */}
        {loading && timeElapsed > 5 && (
          <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-4">
            <div className="font-bold text-red-500">⚠️ LOADING STUCK FOR {timeElapsed} SECONDS!</div>
            <div className="text-sm mt-2">
              The AuthContext loading state has been true for more than 5 seconds.
              This indicates the profile query is hanging or not completing.
            </div>
          </div>
        )}

        {/* Current State - Big Status Board */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border-2 rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">LOADING STATE</div>
            <div className={`text-4xl font-bold ${loading ? 'text-yellow-500' : 'text-green-500'}`}>
              {loading ? '⏳' : '✅'}
            </div>
            <div className="text-lg font-mono mt-2">
              {loading ? 'TRUE' : 'FALSE'}
            </div>
          </div>

          <div className="bg-card border-2 rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">USER SESSION</div>
            <div className={`text-4xl font-bold ${user ? 'text-green-500' : 'text-red-500'}`}>
              {user ? '👤' : '❌'}
            </div>
            <div className="text-lg font-mono mt-2">
              {user ? 'AUTHENTICATED' : 'NULL'}
            </div>
          </div>

          <div className="bg-card border-2 rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">USER PROFILE</div>
            <div className={`text-4xl font-bold ${profile ? 'text-green-500' : 'text-red-500'}`}>
              {profile ? '📋' : '❌'}
            </div>
            <div className="text-lg font-mono mt-2">
              {profile ? 'LOADED' : 'NULL'}
            </div>
          </div>
        </div>

        {/* User Details */}
        {user && (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ID:</span>
                <div className="font-mono">{user.id}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <div className="font-mono">{user.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Details */}
        {profile && (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>
                <div className="font-mono">{profile.email}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Role:</span>
                <div className="font-mono font-bold">{profile.role}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Language:</span>
                <div className="font-mono">{profile.language}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <div className="font-mono text-xs">{new Date(profile.created_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Query Test */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Query Test</h2>
          <button
            onClick={runManualQuery}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            🔍 Run Manual Profile Query
          </button>

          {manualQuery && (
            <div className="mt-4 bg-green-500/10 border border-green-500 rounded p-4">
              <div className="font-semibold text-green-500 mb-2">✅ Manual Query Successful</div>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(manualQuery, null, 2)}
              </pre>
            </div>
          )}

          {manualError && (
            <div className="mt-4 bg-red-500/10 border border-red-500 rounded p-4">
              <div className="font-semibold text-red-500 mb-2">❌ Manual Query Failed</div>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(manualError, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Event Log */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Event Log</h2>
          <div className="bg-black/50 rounded p-4 font-mono text-xs space-y-1 max-h-96 overflow-auto">
            {logs.length === 0 && (
              <div className="text-muted-foreground">No logs yet...</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="text-green-400">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-6">
          <h3 className="font-bold text-blue-500 mb-3">📋 What to Look For:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>If LOADING stays TRUE for &gt;5 seconds:</strong> The profile query in AuthContext is hanging
            </li>
            <li>
              <strong>If USER is NULL:</strong> You're not logged in - go to /login first
            </li>
            <li>
              <strong>If USER exists but PROFILE is NULL:</strong> Profile query failed or didn't complete
            </li>
            <li>
              <strong>Check browser console:</strong> Look for [AuthContext] logs to see where it's stuck
            </li>
            <li>
              <strong>Run Manual Query:</strong> Test if direct profile queries work
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
