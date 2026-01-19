'use client'

/**
 * Supabase Connection Test Page
 *
 * This page tests direct Supabase queries to identify connection issues
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/database'

export default function TestSupabasePage() {
  const [result, setResult] = useState<UserProfile | null>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`])
    console.log(`[TEST] ${msg}`)
  }

  const testQuery = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    setLogs([])

    addLog('Creating Supabase client...')
    const supabase = createClient()

    try {
      addLog('Testing 1: Simple count query on user_profiles')

      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        addLog(`❌ Count query failed: ${countError.message}`)
        setError(countError)
      } else {
        addLog(`✅ Count query succeeded: ${count} profiles found`)
      }

      addLog('Testing 2: Fetching first profile (limit 1)')

      const startTime = Date.now()
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .limit(1)
        .single<UserProfile>()

      const duration = Date.now() - startTime

      if (fetchError) {
        addLog(`❌ Fetch failed after ${duration}ms: ${fetchError.message}`)
        addLog(`   Code: ${fetchError.code}`)
        addLog(`   Details: ${JSON.stringify(fetchError.details)}`)
        setError(fetchError)
      } else if (data) {
        addLog(`✅ Fetch succeeded in ${duration}ms`)
        addLog(`   Profile: ${data.email}, role: ${data.role}`)
        setResult(data)
      }

      addLog('Testing 3: Check auth session')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        addLog(`❌ Session check failed: ${sessionError.message}`)
      } else if (session) {
        addLog(`✅ Session found: ${session.user.email}`)

        addLog('Testing 4: Fetch current user profile')
        const profileStartTime = Date.now()
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const profileDuration = Date.now() - profileStartTime

        if (profileError) {
          addLog(`❌ Profile fetch failed after ${profileDuration}ms: ${profileError.message}`)
        } else {
          addLog(`✅ Profile fetch succeeded in ${profileDuration}ms`)
          setResult(profileData)
        }
      } else {
        addLog('⚠️ No session (user not logged in)')
      }

    } catch (err: any) {
      addLog(`💥 Exception: ${err.message}`)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const testWithTimeout = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    setLogs([])

    addLog('Creating Supabase client with timeout...')
    const supabase = createClient()

    try {
      addLog('Testing query with 5 second timeout...')

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
      })

      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
        .single()

      const startTime = Date.now()
      const result = await Promise.race([queryPromise, timeoutPromise]) as any
      const duration = Date.now() - startTime

      if (result.data) {
        addLog(`✅ Query completed in ${duration}ms`)
        setResult(result.data)
      } else if (result.error) {
        addLog(`❌ Query error: ${result.error.message}`)
        setError(result.error)
      }

    } catch (err: any) {
      if (err.message.includes('timeout')) {
        addLog(`⏱️ Query timed out after 5 seconds - this is the issue!`)
        addLog(`   This suggests a network/CORS/firewall issue`)
      } else {
        addLog(`💥 Exception: ${err.message}`)
      }
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Supabase Connection Test</h1>

        <div className="flex gap-4">
          <button
            onClick={testQuery}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </button>

          <button
            onClick={testWithTimeout}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test with Timeout'}
          </button>
        </div>

        {/* Logs */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Logs</h2>
          <div className="bg-black/50 rounded p-4 font-mono text-xs space-y-1 max-h-96 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">Click a button to run tests...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-green-400">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-500 mb-4">✅ Success</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-500 mb-4">❌ Error</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {/* Environment Info */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
            <div>Publishable Key: {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20)}...</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-6">
          <h3 className="font-bold text-blue-500 mb-2">What to check:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open DevTools (F12) → Network tab</li>
            <li>Filter by "supabase.co" or "user_profiles"</li>
            <li>Run tests and watch for requests</li>
            <li>Check request status: pending, failed, or 200 OK</li>
            <li>If no requests appear, there's a client config issue</li>
            <li>If requests hang, there's a network/CORS issue</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
