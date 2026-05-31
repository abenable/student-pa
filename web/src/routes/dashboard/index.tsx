import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '#/lib/auth-client'
import {
  Zap,
  Clock,
  CheckCircle,
  Activity,
  Sparkles,
  ArrowRight,
  Bot,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ListChecks,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
})

interface AgentData {
  id: string
  name: string
  status: string
  containerRunning: boolean
}

function DashboardIndex() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<AgentData | null>(null)
  const [onboardingSkipped, setOnboardingSkipped] = useState(false)
  const name = session?.user?.name || 'Agent'

  useEffect(() => {
    async function checkAgent() {
      try {
        const res = await fetch('/api/provision')
        if (!res.ok) {
          setAgent(null)
          setLoading(false)
          return
        }
        const data = await res.json()
        const userRole = data.role || (session?.user as any)?.role
        if (userRole === 'admin' || data.onboardingSkipped) {
          setOnboardingSkipped(true)
          setAgent(null)
          setLoading(false)
          return
        }
        if (data.agent) {
          setAgent(data.agent)
          setLoading(false)
          return
        }
        navigate({ to: '/dashboard/onboarding', replace: true })
      } catch {
        setAgent(null)
        setLoading(false)
      }
    }
    if (session?.user) {
      checkAgent()
    }
  }, [session, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-neutral-200 border-t-[#0070d1] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* A. Welcome Header */}
      <header className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-[#0070d1]/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-[#0070d1]" />
          </div>
          <h1 className="text-[36px] md:text-[44px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] text-black dark:text-white">
            Welcome back, {name}
          </h1>
        </div>
        <p className="text-lg text-black/60 dark:text-white/60 leading-[1.5] mt-1">
          Here's what's happening with your agent.
        </p>
      </header>

      {/* B. Agent Status Card */}
      <section className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 mt-8 card-hover-lift animate-fade-in-up delay-100">
        {agent?.status === 'PENDING_APPROVAL' && (
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                Pending Approval
              </div>
              <p className="mt-3 text-xl font-semibold text-black dark:text-white">Your agent request is under review</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0070d1]" />
                Admin will approve your agent shortly
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-full px-7 py-3 h-12 font-bold text-lg inline-flex items-center gap-2 border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Check Status
              </button>
            </div>
          </div>
        )}

        {agent?.status === 'PROVISIONING' && (
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Provisioning
              </div>
              <p className="mt-3 text-xl font-semibold text-black dark:text-white">Setting up your agent...</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0070d1]" />
                This takes about 30 seconds
              </p>
            </div>
          </div>
        )}

        {agent?.status === 'RUNNING' && (
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-300 text-sm font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                Online
              </div>
              <p className="mt-3 text-xl font-semibold text-black dark:text-white">Your agent is ready</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0070d1]" />
                Model: Mythos Agent
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/services"
                className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold text-lg inline-flex items-center gap-2 hover:bg-[#005bb5] transition-all hover:scale-105 active:scale-95"
              >
                Run a Service
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                className="rounded-full px-7 py-3 h-12 font-bold text-lg inline-flex items-center border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {(!agent || ['STOPPED', 'ERROR'].includes(agent.status)) && (
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 text-sm font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                {agent?.status === 'ERROR' ? 'Error' : 'No Agent'}
              </div>
              <p className="mt-3 text-xl font-semibold text-black dark:text-white">
                {agent?.status === 'ERROR' ? 'Something went wrong' : 'You don\'t have an agent yet'}
              </p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0070d1]" />
                {agent?.status === 'ERROR' ? 'Please contact support' : 'Complete onboarding to create one'}
              </p>
            </div>
            {!agent && (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard/onboarding"
                  className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold text-lg inline-flex items-center gap-2 hover:bg-[#005bb5] transition-all hover:scale-105 active:scale-95"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* B2. Onboarding Checklist — shown while agent is not yet RUNNING */}
      {agent?.status !== 'RUNNING' && (
        <section className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 mt-6 animate-fade-in-up delay-150">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="h-5 w-5 text-[#0070d1]" />
            <h2 className="text-base font-semibold text-black dark:text-white">Complete your setup</h2>
          </div>
          <ul className="space-y-3">
            {/* Create account */}
            <li className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full border-2 border-[#0070d1] bg-[#0070d1] flex items-center justify-center shrink-0">
                <CheckCircle className="h-3 w-3 text-white" />
              </span>
              <span className="text-sm text-black/70 dark:text-white/70 line-through">Create your account</span>
            </li>

            {/* Request agent */}
            <li className="flex items-center gap-3">
              {agent ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-[#0070d1] bg-[#0070d1] flex items-center justify-center shrink-0">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-sm text-black/70 dark:text-white/70 line-through">
                    {agent.status === 'PENDING_APPROVAL' ? 'Agent requested (pending approval)' : 'Agent requested'}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-black/20 dark:border-white/20 shrink-0" />
                  <span className="text-sm text-black dark:text-white">Request your agent</span>
                  <Link to="/dashboard/onboarding" className="ml-auto text-xs text-[#0070d1] font-medium hover:underline">
                    Start →
                  </Link>
                </>
              )}
            </li>

            {/* Connect Telegram */}
            <li className="flex items-center gap-3">
              <span className={`h-5 w-5 rounded-full border-2 shrink-0 ${agent?.status === 'RUNNING' ? 'border-black/20 dark:border-white/20' : 'border-black/20 dark:border-white/20'}`} />
              <span className={`text-sm ${agent?.status === 'RUNNING' ? 'text-black dark:text-white' : 'text-black/50 dark:text-white/50'}`}>
                Connect your Telegram bot
              </span>
              {agent?.status === 'RUNNING' && (
                <Link to="/dashboard/settings" className="ml-auto text-xs text-[#0070d1] font-medium hover:underline">
                  Settings →
                </Link>
              )}
            </li>

            {/* Run first service */}
            <li className="flex items-center gap-3">
              <span className={`h-5 w-5 rounded-full border-2 shrink-0 ${agent?.status === 'RUNNING' ? 'border-black/20 dark:border-white/20' : 'border-black/20 dark:border-white/20'}`} />
              <span className={`text-sm ${agent?.status === 'RUNNING' ? 'text-black dark:text-white' : 'text-black/50 dark:text-white/50'}`}>
                Run your first service
              </span>
              {agent?.status === 'RUNNING' && (
                <Link to="/dashboard/services" className="ml-auto text-xs text-[#0070d1] font-medium hover:underline">
                  Services →
                </Link>
              )}
            </li>

            {/* Invite friend */}
            <li className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full border-2 border-black/20 dark:border-white/20 shrink-0" />
              <span className="text-sm text-black dark:text-white">Invite a friend and earn a free week</span>
              <Link to="/dashboard/settings" className="ml-auto text-xs text-[#0070d1] font-medium hover:underline">
                Refer →
              </Link>
            </li>
          </ul>
        </section>
      )}

      {/* C. Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className={`bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 card-hover-lift animate-fade-in-up delay-200 ${agent?.status !== 'RUNNING' ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center transition-transform hover:scale-110">
              <Zap className="h-5 w-5 text-[#0070d1]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-black dark:text-white">0</p>
              <p className="text-sm text-black/60 dark:text-white/60">Services Run</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">Completed tasks</p>
        </div>

        <div className={`bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 card-hover-lift animate-fade-in-up delay-300 ${agent?.status !== 'RUNNING' ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center transition-transform hover:scale-110">
              <Clock className="h-5 w-5 text-[#0070d1]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-black dark:text-white">0h</p>
              <p className="text-sm text-black/60 dark:text-white/60">Agent Uptime</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">Hours online</p>
        </div>

        <div className={`bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 card-hover-lift animate-fade-in-up delay-400 ${agent?.status !== 'RUNNING' ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center transition-transform hover:scale-110">
              <CheckCircle className="h-5 w-5 text-[#0070d1]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-black dark:text-white">0</p>
              <p className="text-sm text-black/60 dark:text-white/60">Tasks Completed</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">This month</p>
        </div>
      </section>

      {/* D. Activity Feed */}
      <section className="mt-8 animate-fade-in-up delay-500">
        <h2 className="text-[22px] font-light leading-[1.25] tracking-[0.1px] text-black dark:text-white">
          Recent Activity
        </h2>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-8 text-center mt-4 transition-all hover:shadow-lg">
          <div className="w-14 h-14 rounded-full bg-[#0070d1]/10 flex items-center justify-center mx-auto animate-bounce-subtle">
            <Activity className="h-7 w-7 text-[#0070d1]" />
          </div>
          <p className="mt-4 text-black/60 dark:text-white/60">
            No activity yet. Run a service to see results here.
          </p>
          <Link
            to="/dashboard/services"
            className="inline-flex items-center gap-1.5 mt-3 text-[#0070d1] font-medium hover:underline transition-transform hover:translate-x-0.5"
          >
            Go to Services
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
