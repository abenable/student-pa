import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { ModeToggle } from '#/components/mode-toggle'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (result.error) {
      setMessage(result.error.message || 'Something went wrong')
    } else {
      setMessage('Reset link sent! Check your email.')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex justify-end p-4">
        <ModeToggle />
      </div>
      <div className="px-4 pb-24">
        <div className="mx-auto" style={{ maxWidth: '448px', width: '100%' }}>
          <div className="text-center mb-8">
            <h1 className="text-[35px] font-light leading-[1.25] font-['Roboto'] mb-2">
              Reset your password
            </h1>
            <p className="text-foreground/70 text-lg leading-[1.5]">
              We&apos;ll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div
                className={`p-3 rounded-sm text-sm ${
                  message.includes('sent')
                    ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:bg-green-500/20 dark:border-green-500/30 dark:text-green-200'
                    : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-200'
                }`}
              >
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 bg-transparent border border-foreground/20 text-foreground rounded-sm px-4 py-3 text-base focus:outline-none focus:border-[#0070d1] placeholder:text-foreground/30"
                placeholder="you@example.com"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold text-lg hover:bg-[#0064b7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/70">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-foreground underline underline-offset-2 hover:opacity-80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
