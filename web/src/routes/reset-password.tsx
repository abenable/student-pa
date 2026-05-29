import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { ModeToggle } from '#/components/mode-toggle'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) {
      setMessage('Invalid or missing reset token')
      return
    }

    setIsLoading(true)

    const result = await authClient.resetPassword({
      newPassword,
      token,
    })

    if (result.error) {
      setMessage(result.error.message || 'Failed to reset password')
    } else {
      setSuccess(true)
      setMessage('Password reset successful!')
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
              Create new password
            </h1>
            <p className="text-foreground/70 text-lg leading-[1.5]">
              Enter your new password below
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-6">
              <div className="p-3 rounded-sm bg-green-500/10 border border-green-500/20 text-green-600 dark:bg-green-500/20 dark:border-green-500/30 dark:text-green-200 text-sm">
                {message}
              </div>
              <Link
                to="/login"
                className="inline-flex bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 items-center text-lg font-bold hover:bg-[#0064b7] transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-200 text-sm">
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-1.5">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold text-lg hover:bg-[#0064b7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
