import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { isAdmin } from '#/lib/roles'
import { ModeToggle } from '#/components/mode-toggle'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    const result = await authClient.signUp.email({
      email,
      password,
      name,
    })

    if (result.error) {
      setError(result.error.message || 'Registration failed')
      setIsLoading(false)
      return
    }

    // Apply referral code if provided
    if (referralCode.trim()) {
      try {
        await fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: referralCode.trim().toUpperCase() }),
        })
      } catch {
        // Silently ignore referral errors, user is already signed up
      }
    }

    const user = result.data?.user as any
    if (isAdmin(user?.role)) {
      navigate({ to: '/dashboard' })
    } else {
      navigate({ to: '/dashboard/onboarding' })
    }
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
              Create your account
            </h1>
            <p className="text-foreground/70">Join AgentHub and get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-200 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-12 bg-transparent border border-foreground/20 text-foreground rounded-sm px-4 py-3 text-base focus:outline-none focus:border-[#0070d1] placeholder:text-foreground/30"
                placeholder="Your full name"
              />
            </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-transparent border border-foreground/20 text-foreground rounded-sm px-4 py-3 text-base focus:outline-none focus:border-[#0070d1] placeholder:text-foreground/30"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-12 bg-transparent border border-foreground/20 text-foreground rounded-sm px-4 py-3 text-base focus:outline-none focus:border-[#0070d1] placeholder:text-foreground/30"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium mb-1.5">
                Referral Code (optional)
              </label>
              <input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full h-12 bg-transparent border border-foreground/20 text-foreground rounded-sm px-4 py-3 text-base focus:outline-none focus:border-[#0070d1] placeholder:text-foreground/30 uppercase"
                placeholder="ABCD1234"
              />
              <p className="mt-1 text-xs text-foreground/50">
                Have a referral code? Enter it to give your friend a free week.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold text-lg hover:bg-[#0064b7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-foreground/70 text-sm">
            Already have an account?{' '}
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
