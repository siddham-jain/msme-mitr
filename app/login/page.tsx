import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      {/* Ambient background glow effect - Requirement 9.2 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--accent)]/[0.02] blur-[150px] rounded-full" />
      </div>
      
      {/* Auth Card - Centered with glass effect - Requirements 9.1, 9.2 */}
      <div className="w-full max-w-md relative z-10">
        {/* Glass Card with xl border radius (16px) */}
        <div className="bg-[var(--card)] backdrop-blur-[8px] border border-[var(--border)] rounded-xl p-8">
          {/* Header with Space Grotesk - Requirement 9.5 */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Welcome back
            </h1>
            <p className="text-[var(--muted-foreground)] mt-2">
              Sign in to your account
            </p>
          </div>
          
          {/* Login Form */}
          <LoginForm />
          
          {/* Forgot Password Link */}
          <div className="text-center mt-6">
            <Link 
              href="/reset-password" 
              className="text-sm text-[var(--foreground)] hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
        
        {/* Signup Link */}
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[var(--foreground)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
