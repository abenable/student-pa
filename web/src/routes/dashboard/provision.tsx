import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { authClient } from '#/lib/auth-client'
import { CheckCircle, Loader2 } from 'lucide-react'

const BIO_OPTIONS = [
  '🎓 1st year - general help',
  '💻 2nd year CS - coding & labs',
  '🔬 3rd/4th year - research & thesis',
  '📊 Business - assignments',
  '⚕️ Medicine - reports',
  '⚖️ Law - briefs & research',
  '📝 Job applications & CVs',
  '🎯 All-around student help',
]

export const Route = createFileRoute('/dashboard/provision')({
  component: ProvisionPage,
})

function ProvisionPage() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1)
  const [agentName, setAgentName] = useState('')
  const [userName, setUserName] = useState(session?.user?.name || '')
  const [bio, setBio] = useState('')
  const [customBio, setCustomBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        navigate({ to: '/dashboard' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [step, navigate])

  const handleCreateAgent = async () => {
    setIsSubmitting(true)
    // Simulate provisioning call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setStep('success')
  }

  const selectedBio = bio || customBio

  return (
    <div className="min-h-screen bg-white dark:bg-[#121314]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-2.5 w-2.5 rounded-full transition-colors"
              style={{
                backgroundColor:
                  step === 'success'
                    ? '#cccccc'
                    : step >= s
                      ? '#0070d1'
                      : '#cccccc',
              }}
            />
          ))}
        </div>

        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-8 mx-auto mt-12" style={{ maxWidth: '576px', width: '100%' }}>
          {step === 1 && (
            <div>
              <h1 className="text-[35px] font-light leading-[1.25] font-['Roboto'] text-black dark:text-white">
                Name Your Agent
              </h1>
              <p className="text-lg text-black/60 dark:text-white/60 mt-2 mb-8">
                What would you like to call your personal assistant?
              </p>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. StudyBuddy"
                className="w-full h-12 border border-[#cccccc] rounded-sm px-4 text-base focus:outline-none focus:border-[#0070d1] bg-white dark:bg-[#121314] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
              />
              <div className="mt-8">
                <button
                  type="button"
                  disabled={!agentName.trim()}
                  onClick={() => setStep(2)}
                  className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-[#005bb3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-[35px] font-light leading-[1.25] font-['Roboto'] text-black dark:text-white">
                What&apos;s your name?
              </h1>
              <p className="text-lg text-black/60 dark:text-white/60 mt-2 mb-8">
                How should your agent address you?
              </p>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="w-full h-12 border border-[#cccccc] rounded-sm px-4 text-base focus:outline-none focus:border-[#0070d1] bg-white dark:bg-[#121314] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
              />
              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-black/20 dark:border-white/20 text-black dark:text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!userName.trim()}
                  onClick={() => setStep(3)}
                  className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-[#005bb3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-[35px] font-light leading-[1.25] font-['Roboto'] text-black dark:text-white">
                Tell us about yourself
              </h1>
              <p className="text-lg text-black/60 dark:text-white/60 mt-2 mb-8">
                Select an option or describe your role.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {BIO_OPTIONS.map((option) => {
                  const isActive = bio === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setBio(option)
                        setCustomBio('')
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                        isActive
                          ? 'bg-white dark:bg-[#121314] text-black dark:text-white border border-[#cccccc]'
                          : 'bg-[rgba(245,247,250,0.3)] text-black dark:text-white hover:bg-white/60'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              <textarea
                value={customBio}
                onChange={(e) => {
                  setCustomBio(e.target.value)
                  setBio('')
                }}
                placeholder="Or write a custom bio..."
                rows={3}
                className="w-full border border-[#cccccc] rounded-sm px-4 py-3 text-base focus:outline-none focus:border-[#0070d1] bg-white dark:bg-[#121314] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 resize-none"
              />

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-black/20 dark:border-white/20 text-black dark:text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedBio.trim() || isSubmitting}
                  onClick={handleCreateAgent}
                  className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-[#005bb3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Agent'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
              <h2 className="text-[28px] font-light leading-[1.25] font-['Roboto'] text-black dark:text-white mb-3">
                Your agent is being provisioned!
              </h2>
              <p className="text-lg text-black/60 dark:text-white/60">
                This takes about 30 seconds. We&apos;ll redirect you to the
                dashboard.
              </p>
              <div className="mt-6">
                <Link
                  to="/dashboard"
                  className="text-[#0070d1] underline underline-offset-2 hover:text-[#005bb3]"
                >
                  Go to dashboard now
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
