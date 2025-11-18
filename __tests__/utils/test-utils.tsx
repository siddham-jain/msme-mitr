/**
 * Test Utilities
 * Common testing utilities, custom render functions, and test helpers
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import type { User } from '@supabase/supabase-js'

// Mock user data for testing
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {
    full_name: 'Test User',
  },
}

// Mock conversation data
export const mockConversation = {
  id: 'test-conversation-id',
  user_id: 'test-user-id',
  title: 'Test Conversation',
  session_id: 'test-session-id',
  language: 'en',
  model: 'anthropic/claude-3-haiku',
  message_count: 0,
  is_archived: false,
  is_pinned: false,
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: '2024-01-01T00:00:00Z',
}

// Mock message data
export const mockMessage = {
  id: 'test-message-id',
  conversation_id: 'test-conversation-id',
  role: 'user' as const,
  content: 'Test message content',
  parts: null,
  created_at: '2024-01-01T00:00:00Z',
}

// Mock scheme data
export const mockScheme = {
  id: 'test-scheme-id',
  scheme_name: 'Test Scheme',
  scheme_url: 'https://example.com/scheme',
  ministry: 'Ministry of Test',
  description: 'Test scheme description',
  category: 'Financial',
  details: { test: 'details' },
  benefits: { test: 'benefits' },
  eligibility: { test: 'eligibility' },
  application_process: { test: 'process' },
  documents_required: { test: 'documents' },
  financial_details: { test: 'financial' },
  tags: ['test', 'scheme'],
  target_audience: ['MSME'],
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null
}

export function renderWithProviders(
  ui: ReactElement,
  { user = mockUser, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response)
}

export const mockFetchError = (message: string, status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => ({ error: message }),
    text: async () => JSON.stringify({ error: message }),
  } as Response)
}

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
