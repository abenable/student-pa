import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { ModeToggle } from '#/components/mode-toggle'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await authClient.signIn.email({
      email,
      password,
    })

    if (result.error) {
      setError(result.error.message || 'Sign in failed')
      setIsLoading(false)
      return
    }

    const user = result.data?.user as any
    if (user?.role === 'admin') {
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
              Sign in to AgentHub
            </h1>
            <p className="text-foreground/70">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-200 text-sm">
                {error}
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold text-lg hover:bg-[#0064b7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-foreground/70 text-sm">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-foreground underline underline-offset-2 hover:opacity-80"
            >
              Sign up
            </Link>
          </p>

          <p className="mt-3 text-center text-sm">
            <Link
              to="/forgot-password"
              className="text-foreground/70 hover:text-foreground underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
