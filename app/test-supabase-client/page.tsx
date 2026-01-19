'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Test page to verify Supabase client-side initialization
 * Visit /test-supabase-client to test
 */
export default function TestSupabaseClientPage() {
  const [status, setStatus] = useState<{
    clientInit: boolean
    serverInit: boolean
    error?: string
  }>({
    clientInit: false,
    serverInit: false,
  })

  useEffect(() => {
    async function testClients() {
      try {
        // Test client-side initialization
        const supabase = createClient()

        if (!supabase) {
          throw new Error('Failed to create client')
        }

        // Test a simple query
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setStatus({
            clientInit: true,
            serverInit: false,
            error: `Client initialized but auth check failed: ${error.message}`,
          })
          return
        }

        // Test server-side via API route
        const response = await fetch('/api/test-supabase')
        const serverResult = await response.json()

        setStatus({
          clientInit: true,
          serverInit: serverResult.success,
          error: serverResult.success ? undefined : serverResult.error,
        })
      } catch (error) {
        setStatus({
          clientInit: false,
          serverInit: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    testClients()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold">Supabase Client Test</h1>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Client-Side Client</h2>
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${status.clientInit ? 'text-green-500' : 'text-red-500'}`}>
                {status.clientInit ? '✅' : '❌'}
              </span>
              <span>
                {status.clientInit ? 'Initialized successfully' : 'Initialization failed'}
              </span>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Server-Side Client</h2>
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${status.serverInit ? 'text-green-500' : 'text-red-500'}`}>
                {status.serverInit ? '✅' : '❌'}
              </span>
              <span>
                {status.serverInit ? 'Initialized successfully' : 'Initialization failed'}
              </span>
            </div>
          </div>

          {status.error && (
            <div className="p-4 border border-red-500 rounded-lg bg-red-50">
              <h2 className="text-xl font-semibold mb-2 text-red-700">Error</h2>
              <p className="text-red-600">{status.error}</p>
            </div>
          )}

          <div className="p-4 border rounded-lg bg-blue-50">
            <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
            <div className="space-y-1 text-sm">
              <p>
                <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}
              </p>
              <p>
                <strong>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:</strong>{' '}
                {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
