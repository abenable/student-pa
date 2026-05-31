import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { isAdmin } from '#/lib/roles'

const BIO_OPTIONS = [
  { emoji: '🎓', label: '1st year - general help', value: '1st year student looking for general academic help' },
  { emoji: '💻', label: '2nd year CS - coding & labs', value: '2nd year CS, need help with coding and lab reports' },
  { emoji: '🔬', label: '3rd/4th year - research & thesis', value: '3rd/4th year, need help with research and thesis' },
  { emoji: '📊', label: 'Business - assignments', value: 'Business student, need help with assignments and presentations' },
  { emoji: '⚕️', label: 'Medicine - reports', value: 'Medical student, need help with reports and case studies' },
  { emoji: '⚖️', label: 'Law - briefs & research', value: 'Law student, need help with case briefs and legal research' },
  { emoji: '📝', label: 'Job applications & CVs', value: 'Need help with job applications, CVs and interview prep' },
  { emoji: '🎯', label: 'All-around student help', value: 'Need all-around help with student life and academics' },
]

export const Route = createFileRoute('/dashboard/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [bio, setBio] = useState('')
  const [agentName, setAgentName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checkingAgent, setCheckingAgent] = useState(true)

  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    async function checkExistingAgent() {
      try {
        const user = session?.user as any
        // Admins and enterprise managers skip onboarding entirely
        if (isAdmin(user?.role)) {
          navigate({ to: '/dashboard', replace: true })
          return
        }
        const res = await fetch('/api/provision')
        if (res.ok) {
          const data = await res.json()
          if (data.agent) {
            navigate({ to: '/dashboard', replace: true })
            return
          }
        }
      } catch {
        // ignore
      }
      setCheckingAgent(false)
    }
    if (session?.user) {
      checkExistingAgent()
    }
  }, [session, navigate])

  const handleSkip = async () => {
    await fetch('/api/onboarding/skip', { method: 'POST' })
    setSkipped(true)
    navigate({ to: '/dashboard', replace: true })
  }

  const handleCreateAgent = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agentName.trim(),
          studentName: session?.user?.name || '',
          bio,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to create agent')
      }

      setStep(5)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  const userName = session?.user?.name || 'there'

  if (checkingAgent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#0070d1] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto px-6 py-16" style={{ maxWidth: '576px', width: '100%' }}>
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-2 w-2 rounded-full transition-colors"
              style={{
                backgroundColor:
                  step === 5
                    ? '#cccccc'
                    : step >= s
                      ? '#0070d1'
                      : '#cccccc',
              }}
            />
          ))}
        </div>

        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-8">
          {step === 1 && (
            <div className="text-center">
              <h1 className="text-[35px] font-light leading-[1.25] font-['Roboto']">
                Welcome, {userName}!
              </h1>
              <p className="text-lg text-foreground/60 mt-4">
                Let&apos;s set up your personal AI agent in under a minute.
              </p>
              <Button
                onClick={() => setStep(2)}
                className="mt-8 bg-[#0070d1] text-white rounded-full px-8 h-12 text-lg font-bold hover:bg-[#0064b7]"
              >
                Get Started
              </Button>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-foreground/50 hover:text-foreground underline underline-offset-2"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-[28px] font-light leading-[1.25] font-['Roboto']">
                What describes you best?
              </h1>
              <p className="text-foreground/60 mt-2">
                This helps your agent understand how to assist you.
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                {BIO_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBio(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                      bio === option.value
                        ? 'bg-foreground text-background'
                        : 'bg-white dark:bg-[#121314] text-foreground border border-foreground/10 hover:border-foreground/30'
                    }`}
                  >
                    {option.emoji} {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-foreground/20 text-foreground rounded-full px-6 h-12 font-bold"
                >
                  Back
                </Button>
                <Button
                  disabled={!bio}
                  onClick={() => setStep(3)}
                  className="bg-[#0070d1] text-white rounded-full px-7 h-12 font-bold hover:bg-[#0064b7] disabled:opacity-50"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-[28px] font-light leading-[1.25] font-['Roboto']">
                Name your agent
              </h1>
              <p className="text-foreground/60 mt-2">
                What would you like to call your personal assistant?
              </p>

              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. StudyBuddy, Max, Aria"
                className="w-full h-12 mt-6 bg-white dark:bg-[#121314] border border-foreground/20 text-foreground rounded-sm px-4 text-base focus:outline-none focus:border-[#0070d1] placeholder:text-foreground/30"
              />

              {error && (
                <div className="mt-4 p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-8 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-foreground/20 text-foreground rounded-full px-6 h-12 font-bold"
                >
                  Back
                </Button>
                <Button
                  disabled={!agentName.trim() || isSubmitting}
                  onClick={() => {
                    setStep(4)
                    handleCreateAgent()
                  }}
                  className="bg-[#0070d1] text-white rounded-full px-7 h-12 font-bold hover:bg-[#0064b7] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Agent'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-12 w-12 text-[#0070d1] animate-spin mb-6" />
              <h2 className="text-[24px] font-light leading-[1.25] font-['Roboto']">
                Submitting for approval...
              </h2>
              <p className="text-foreground/60 mt-2">
                Your agent request is being sent for admin approval.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-amber-500 mb-6" />
              <h2 className="text-[24px] font-light leading-[1.25] font-['Roboto']">
                Pending admin approval
              </h2>
              <p className="text-foreground/60 mt-2 max-w-sm mx-auto">
                Your agent <strong>{agentName}</strong> has been submitted. An admin will review and approve your request shortly. You'll receive access once approved.
              </p>
              <Button
                onClick={() => navigate({ to: '/dashboard' })}
                className="mt-6 bg-[#0070d1] text-white rounded-full px-7 h-12 font-bold hover:bg-[#0064b7]"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
