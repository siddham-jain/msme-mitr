import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
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
              Create Account
            </h1>
            <p className="text-[var(--muted-foreground)] mt-2">
              Join MSME Mitr to discover government schemes
            </p>
          </div>
          
          {/* Signup Form */}
          <SignupForm />
        </div>
        
        {/* Login Link */}
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--foreground)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
