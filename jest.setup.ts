import '@testing-library/jest-dom'

// Polyfill for Next.js server components
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Polyfill for TransformStream (needed for AI SDK)
global.TransformStream = class TransformStream {
  readable: any
  writable: any

  constructor() {
    this.readable = {}
    this.writable = {}
  }
} as any

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'test-publishable-key'

// Mock Web APIs for Next.js
global.Request = class Request {
  url: string
  method: string
  headers: any

  constructor(url: string, init?: any) {
    this.url = url
    this.method = init?.method || 'GET'
    this.headers = init?.headers || new Map()
  }
} as any

global.Response = class Response {
  body: any
  init: any
  status: number
  statusText: string
  headers: any

  constructor(body: any, init?: any) {
    this.body = body
    this.init = init
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = init?.headers || new Map()
  }

  static json(data: any, init?: any) {
    const response = new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
    response.json = async () => data
    return response
  }

  async json() {
    return JSON.parse(this.body)
  }
} as any

global.Headers = class Headers {
  private headers: Map<string, string> = new Map()

  set(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value)
  }

  get(name: string) {
    return this.headers.get(name.toLowerCase())
  }

  has(name: string) {
    return this.headers.has(name.toLowerCase())
  }

  delete(name: string) {
    this.headers.delete(name.toLowerCase())
  }

  forEach(callback: (value: string, key: string) => void) {
    this.headers.forEach(callback)
  }
} as any

global.fetch = jest.fn() as any
