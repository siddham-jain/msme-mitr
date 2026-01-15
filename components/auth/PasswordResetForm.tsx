'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { passwordResetSchema, type PasswordResetFormData } from '@/lib/validators/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'

export function PasswordResetForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: PasswordResetFormData) {
    try {
      setIsLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) throw error

      setIsSuccess(true)
      toast.success('Password reset email sent!')
      form.reset()
    } catch (error: any) {
      console.error('Password reset error:', error)
      
      // Don't reveal if email exists for security - Requirement 9.6
      const errorMessage = 'If an account exists with this email, you will receive a password reset link.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div 
          role="status"
          aria-live="polite"
          className="rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 p-4"
        >
          <p className="text-sm text-[var(--foreground)]">
            Check your email for a password reset link. The link will expire in 1 hour.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsSuccess(false)}
        >
          Send another email
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label="Password reset form">
        {/* Error Message - Requirements 9.6, 12.4 */}
        {error && (
          <div 
            role="alert"
            aria-live="polite"
            className="p-3 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm"
          >
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[var(--foreground)]">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  aria-describedby="email-description email-error"
                  aria-invalid={!!form.formState.errors.email}
                  {...field}
                />
              </FormControl>
              <FormDescription id="email-description" className="text-[var(--muted-foreground)]">
                Enter your email address and we'll send you a link to reset your password.
              </FormDescription>
              <FormMessage id="email-error" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>
    </Form>
  )
}
